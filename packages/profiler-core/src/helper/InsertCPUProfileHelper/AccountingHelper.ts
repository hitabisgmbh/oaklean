import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'
import { State } from './types/state'
import {
	ToLangInternalTransition,
	ToProjectTransition,
	ToModuleTransition,
} from './types/transition'
import {
	AccountingInfo
} from './types/accounting'
import { AwaiterStack } from './types/stack'

import { CPUNode } from '../CPUProfile/CPUNode'
import { GlobalIdentifier} from '../../system'
import { ProjectReport } from '../../model/ProjectReport'
import { SourceNodeMetaData } from '../../model/SourceNodeMetaData'
// Types
import {
	ISensorValues,
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	MicroSeconds_number,
	MilliJoule_number,
	SourceNodeMetaDataType
} from '../../types'
import { TypescriptHelper } from '../TypescriptParser'


export class AccountingHelper {
	// IMPORTANT to change when new measurement type gets added
	// if a node was already visited, set the aggregated measurements to 0
	// to avoid double counting of measurements
	static sensorValuesForVisitedNode(
		sensorValues: ISensorValues,
		visited: boolean,
	): ISensorValues {
		const result = {
			...sensorValues
		}

		if (visited) {
			result.aggregatedCPUTime = 0 as MicroSeconds_number
			result.aggregatedCPUEnergyConsumption = 0 as MilliJoule_number
			result.aggregatedRAMEnergyConsumption = 0 as MilliJoule_number
		}

		return result
	}

	/**
	 * This method creates a new source node (if it does not exist)
	 * in the [lang internal] section of the current report.
	 * And adds the sensor values of the cpu node to the new source node.
	 * 
	 * It also handles the linking of the newly created source node to the current source node.
	 * 
	 * @param cpuNode the new cpu node (that should be inserted)
	 * @param transition the transition (by inserting the cpu node)
	 * 
	 * @returns the new state
	 */
	static async accountToLangInternal(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToLangInternalTransition,
		callRelationTracker: CallRelationTracker
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues

		const accountedSourceNode = currentState.callIdentifier.report.addToLangInternal(
			cpuNode.sourceLocation.rawUrl as LangInternalPath_string,
			cpuNode.sourceLocation.sourceNodeIdentifier as LangInternalSourceNodeIdentifier_string
		)

		const currentCallIdentifier = new CallIdentifier(
			currentState.callIdentifier.report,
			accountedSourceNode
		)
		const firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal'
		)

		if (transition.options.headless) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
			currentState.callIdentifier.report.lang_internalHeadlessSensorValues.addToSelf(sensorValues)
		}

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
			sensorValues,
			!firstTimeVisited
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		let accountedSourceNodeReference: {
			firstTimeVisited: boolean,
			reference: SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
		} | null

		if (transition.options.createLink) {
			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToLangInternal: Current state has no source node assigned')
			}
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)
			
			const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
				sensorValues,
				alreadyLinked
			)
			accountedSourceNodeReference = {
				firstTimeVisited: !alreadyLinked,
				reference: currentState.callIdentifier.sourceNode.addSensorValuesToLangInternal(
					accountedSourceNode.globalIdentifier(),
					accountedSensorValues
				)
			}
			accountedSourceNodeReference.reference.sensorValues.profilerHits += cpuNode.profilerHits
		} else {
			accountedSourceNodeReference = null
		}

		return {
			nextState: {
				scope: currentState.scope,
				type: 'lang_internal',
				headless: transition.options.headless,
				callIdentifier: currentCallIdentifier
			},
			accountingInfo: {
				type: 'accountToLangInternal',
				accountedSourceNode: {
					node: accountedSourceNode,
					firstTimeVisited: firstTimeVisited
				},
				accountedSensorValues,
				accountedSourceNodeReference
			}
		}
	}

	/**
	 * This method creates a new source node (if it does not exist)
	 * in the [intern] section of the current report.
	 * And adds the sensor values of the cpu node to the new source node.
	 * 
	 * It also handles the linking of the newly created source node to the current source node.
	 * 
	 * @param cpuNode the new cpu node (that should be inserted)
	 * @param transition the transition (by inserting the cpu node)
	 * 
	 * @returns the new state
	 */
	static async accountToIntern(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToProjectTransition | ToModuleTransition,
		callRelationTracker: CallRelationTracker,
		awaiterStack: AwaiterStack
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation

		let accountedSourceNodeReference: {
			firstTimeVisited: boolean,
			reference: SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
		} | null

		// intern
		const accountedSourceNode = currentState.callIdentifier.report.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier
		)
		accountedSourceNode.presentInOriginalSourceCode = transition.options.presentInOriginalSourceCode
		const currentCallIdentifier = new CallIdentifier(
			currentState.callIdentifier.report,
			accountedSourceNode
		)
		const firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
			sensorValues,
			!firstTimeVisited
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		if (sourceNodeLocation.functionIdentifier === TypescriptHelper.awaiterSourceNodeIdentifier()) {
			currentCallIdentifier.isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the parentNodeInfo.sourceNode is null or of type lang internal
			// the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			awaiterStack.push({
				awaiter: accountedSourceNode,
				awaiterParent: currentState.callIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode ?
					(currentState.callIdentifier.sourceNode as
						SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>) :
					undefined
			})
		}

		if (
			!currentCallIdentifier.isAwaiterSourceNode &&
			awaiterStack.length > 0
		) {
			/*
				The current source node is not an awaiter
				but there is an awaiter in the source file and the current source node was called by it.
				If the current source node was already using the awaiter (as an intern call) in the call tree,
				subtract the current aggregated measurements, since they are already accounted
			*/
			const lastAwaiterNode = awaiterStack[awaiterStack.length - 1]
			if (lastAwaiterNode === undefined) {
				throw new Error('InsertCPUProfileHelper.accountToIntern: expected an awaiter in awaiterStack')
			}
			if (
				callRelationTracker.isCallRecorded(
					new CallIdentifier(
						currentState.callIdentifier.report,
						lastAwaiterNode.awaiter
					)) && lastAwaiterNode.awaiterParent === accountedSourceNode
			) {
				// the async function resolved when the awaiter was called,
				// the last function call was the child function of the awaiter (fulfilled, rejected or step)
				// and the current source node is the async function that called the awaiter

				const awaiterInternChild = accountedSourceNode.intern.get(
					lastAwaiterNode.awaiter.id
				)
				if (awaiterInternChild !== undefined) {
					awaiterInternChild.sensorValues.addToAggregated(sensorValues, -1)
					accountedSourceNode.sensorValues.addToIntern(sensorValues, -1)
				}
			}
		}

		if (transition.options.createLink) {
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)

			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}

			if (currentState.callIdentifier.sourceNode !== accountedSourceNode) {
				// only create a reference if its not a recursive call
				const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
					sensorValues,
					alreadyLinked
				)
				accountedSourceNodeReference = {
					firstTimeVisited: !alreadyLinked,
					reference: currentState.callIdentifier.sourceNode.addSensorValuesToIntern(
						accountedSourceNode.globalIdentifier(),
						accountedSensorValues
					)
				}
				accountedSourceNodeReference.reference.sensorValues.profilerHits += cpuNode.profilerHits
			} else {
				accountedSourceNodeReference = null
			}
		} else {
			accountedSourceNodeReference = null
		}

		return {
			nextState: {
				scope: transition.transition === 'toProject' ? 'project' : 'module',
				type: 'intern',
				headless: false,
				callIdentifier: currentCallIdentifier
			},
			accountingInfo: {
				type: 'accountToIntern',
				accountedSourceNode: {
					node: accountedSourceNode,
					firstTimeVisited: firstTimeVisited
				},
				accountedSensorValues,
				accountedSourceNodeReference
			}
		}
	}

	/**
	 * This method creates a new source node and node module (if it does not exist) in the current report
	 * in the [extern] section of the current report.
	 * And adds the sensor values of the cpu node to the new source node.
	 * 
	 * It also handles the linking of the newly created source node to the current source node.
	 * 
	 * @param cpuNode the new cpu node (that should be inserted)
	 * @param transition the transition (by inserting the cpu node)
	 * 
	 * @returns the new state
	 */
	static async accountToExtern(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToModuleTransition,
		callRelationTracker: CallRelationTracker
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation
		const nodeModule = transition.options.nodeModule
		let accountedSourceNodeReference: {
			firstTimeVisited: boolean,
			reference: SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
		} | null

		const globalIdentifier = new GlobalIdentifier(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
			nodeModule
		)

		// extern
		const { report, sourceNodeMetaData: accountedSourceNode } = currentState.callIdentifier.report.addToExtern(
			sourceNodeLocation.relativeFilePath,
			nodeModule,
			sourceNodeLocation.functionIdentifier
		)
		accountedSourceNode.presentInOriginalSourceCode = transition.options.presentInOriginalSourceCode
		const currentCallIdentifier = new CallIdentifier(
			report,
			accountedSourceNode
		)
		const firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'extern')

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
			sensorValues,
			!firstTimeVisited
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		if (transition.options.createLink) {
			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)

			const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
				sensorValues,
				alreadyLinked
			)
			accountedSourceNodeReference = {
				firstTimeVisited: !alreadyLinked,
				reference: currentState.callIdentifier.sourceNode.addSensorValuesToExtern(
					globalIdentifier,
					accountedSensorValues
				)
			}
			accountedSourceNodeReference.reference.sensorValues.profilerHits += cpuNode.profilerHits
		} else {
			accountedSourceNodeReference = null
		}

		return {
			nextState: {
				scope: 'module',
				type: 'intern',
				headless: false,
				callIdentifier: currentCallIdentifier
			},
			accountingInfo: {
				type: 'accountToExtern',
				accountedSourceNode: {
					node: accountedSourceNode,
					firstTimeVisited: firstTimeVisited
				},
				accountedSensorValues,
				accountedSourceNodeReference
			}
		}
	}

	/**
	 * This method is called when the new cpu node belongs to the project source code
	 * but was executed by an external function (module or wasm).
	 * 
	 * It creates a new source node (if it does not exist) in the [intern] section of the current report.
	 * And adds the sensor values of the cpu node to the new source node.
	 * 
	 * It does NOT create a link to the parent, since the parent call is from a different report.
	 * Since Wasm code is treated as external code, it has its own report.
	 * 
	 * @param originalReport the original report where the cpu profile is inserted
	 * @param cpuNode the new cpu node (that should be inserted)
	 * @param transition the transition (by inserting the cpu node)
	 * 
	 * @returns the new state
	 */
	static async accountOwnCodeGetsExecutedByExternal(
		originalReport: ProjectReport,
		cpuNode: CPUNode,
		transition: ToProjectTransition,
		callRelationTracker: CallRelationTracker
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation

		const accountedSourceNode = originalReport.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
		)
		accountedSourceNode.presentInOriginalSourceCode = transition.options.presentInOriginalSourceCode
		const currentCallIdentifier = new CallIdentifier(
			originalReport,
			accountedSourceNode
		)
		const firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = AccountingHelper.sensorValuesForVisitedNode(
			sensorValues,
			!firstTimeVisited
		)
		// add measurements to original source code
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		if (transition.options.createLink) {
			throw new Error('InsertCPUProfileStateMachine.accountOwnCodeGetsExecutedByExternal: Cannot create link to parent, since the parent call is from a different report')
		}

		return {
			nextState: {
				scope: 'project',
				type: 'intern',
				headless: false,
				callIdentifier: currentCallIdentifier
			},
			accountingInfo: {
				type: 'accountOwnCodeGetsExecutedByExternal',
				accountedSourceNode: {
					node: accountedSourceNode,
					firstTimeVisited: firstTimeVisited
				},
				accountedSensorValues,
				accountedSourceNodeReference: null
			}
		}
	}
}