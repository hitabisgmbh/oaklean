import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'
import { State } from './types/state'
import {
	Transition,
	ToLangInternalTransition,
	ToProjectTransition,
	ToModuleTransition
} from './types/transition'
import {
	AccountingInfo
} from './types/accounting'
import { StackFrame } from './types/stack'
import { StateMachineLogger } from './StateMachineLogger'
import { CompensationHelper } from './CompensationHelper'

import { CPUModel } from '../CPUProfile/CPUModel'
import { CPUNode } from '../CPUProfile/CPUNode'
import { ResolveFunctionIdentifierHelper } from '../ResolveFunctionIdentifierHelper'
import { GlobalIdentifier, UnifiedPath } from '../../system'
import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import { WASM_NODE_MODULE } from '../../model/NodeModule'
import { SourceNodeMetaData } from '../../model/SourceNodeMetaData'
import { MetricsDataCollection } from '../../model/interfaces/MetricsDataCollection'
import { ICpuProfileRaw } from '../../../lib/vscode-js-profile-core/src/cpu/types'
// Types
import {
	ISensorValues,
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	NanoSeconds_BigInt,
	MicroSeconds_number,
	MilliJoule_number,
	SourceNodeMetaDataType,
	SourceNodeIdentifier_string
} from '../../types'
import { TypescriptHelper } from '../TypescriptParser'
import { LoggerHelper } from '../LoggerHelper'
import { CPUProfileSourceLocation } from '../CPUProfile'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertUnreachable(x: never): never {
	throw new Error('Didn\'t expect to get here')
}

type AwaiterStack = {
	awaiter: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>, // the last called __awaiter function
	awaiterParent: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined // the last async function that called the __awaiter function
}[]

/**
 * This state machine is responsible to track the current state of the CPU profile insertion.
 * It handles transitions between different states based on the source location of the CPU nodes.
 * The states include:
 * - Project: when the current function belongs to the project source code.
 * - Module: when the current function belongs to an external module.
 * - LangInternal: when the current function is a language internal function (e.g., V8 internals).
 * - Wasm: when the current function is a WebAssembly function.
 * 
 * The state machine uses the ResolveFunctionIdentifierHelper to determine the appropriate state
 * based on the source location of the CPU nodes.
 * It also tracks call relations to avoid double counting of sensor values for already recorded calls.
 * 
 * The state machine maintains an awaiter stack to correctly account for async function calls and their awaiters.
 * This ensures that sensor values are accurately attributed to the correct source nodes in async scenarios.
 * 
 */
export class InsertCPUProfileStateMachine {
	projectReport: ProjectReport

	callRelationTracker: CallRelationTracker
	awaiterStack: AwaiterStack

	debug: boolean = false

	constructor(reportToApply: ProjectReport) {
		this.projectReport = reportToApply
		this.callRelationTracker = new CallRelationTracker()
		this.awaiterStack = []
	}

	/**
	 * Inserts a CPU profile into the state machine, updating the project report accordingly.
	 * 
	 * @param resolveFunctionIdentifierHelper the helper to resolve function identifiers
	 * @param profile the raw cpu profile to insert
	 * @param metricsDataCollection optional metrics data collection to enrich the cpu profile with energy values
	 */
	async insertCPUProfile(
		rootDir: UnifiedPath,
		resolveFunctionIdentifierHelper: ResolveFunctionIdentifierHelper,
		profile: ICpuProfileRaw,
		metricsDataCollection?: MetricsDataCollection,
	) {
		if (this.projectReport.executionDetails.highResolutionBeginTime === undefined) {
			throw new Error('InsertCPUProfileHelper.insertCPUProfile: executionDetails.highResolutionBeginTime is undefined')
		}
		const cpuModel = new CPUModel(
			rootDir,
			profile,
			BigInt(this.projectReport.executionDetails.highResolutionBeginTime) as NanoSeconds_BigInt
		)

		if (metricsDataCollection && metricsDataCollection.items.length > 0) {
			// fill the cpu model with energy values
			cpuModel.energyValuesPerNode = cpuModel.energyValuesPerNodeByMetricsData(metricsDataCollection)
		}

		await this.insertCPUNodes(
			cpuModel.getNode(0),
			resolveFunctionIdentifierHelper
		)
	}

	/**
	 * Inserts CPU nodes into the state machine, updating the project report accordingly.
	 * 
	 * @param rootNode the root node of the cpu model
	 * @param resolveFunctionIdentifierHelper the helper to resolve function identifiers
	 */
	async insertCPUNodes(
		rootNode: CPUNode,
		resolveFunctionIdentifierHelper: ResolveFunctionIdentifierHelper
	) {
		const stack: StackFrame[] = [
			{
				// begin state
				state:  {
					scope: 'project',
					type: 'lang_internal',
					headless: true,
					callIdentifier: new CallIdentifier(
						this.projectReport,
						null
					)
				},
				node: rootNode,
				depth: 0
			}]

		// traverse the cpu nodes depth first
		while (stack.length > 0) {
			const currentStackFrame = stack[stack.length - 1]

			if (currentStackFrame.result) {
				// second visit of the node, do post processing
				stack.pop()
				if (currentStackFrame.result.accountingInfo === null) {
					// it was a stayInState transition
					// no post processing needed
					continue
				}
				// state that is about to get left: currentStackFrame.result.nextState
				// so the parent state is: currentStackFrame.state:
				const parentState = currentStackFrame.state
				// this state is about to get left (all children have been processed):
				const currentState = currentStackFrame.result.nextState
				const accountingInfo = currentStackFrame.result.accountingInfo

				// check wether a link was created
				if (accountingInfo.accountedSourceNodeReference !== null) {
					// remove the last child call from the current state
					if (!this.callRelationTracker.removeLastChildRecord(parentState.callIdentifier)) {
						throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: expected childCalls to be present')
					}
				}
				if (currentState.callIdentifier.firstTimeVisited) {
					this.callRelationTracker.removeCallRecord(currentState.callIdentifier)
				}
				if (this.debug) {
					StateMachineLogger.logState(
						currentStackFrame.depth + 1,
						currentStackFrame.node,
						currentState
					)
				}
				
				const compensation = currentStackFrame.result.compensation
				// Compensation handling:
				if (compensation !== undefined) {
					if (parentState.callIdentifier.sourceNode !== null) {
						// the aggregated always needs to be compensated
						parentState.callIdentifier.sourceNode.compensateAggregatedSensorValues(
							compensation
						)

						// only compensate (lang_internal|intern|extern) when there was a link created
						if (accountingInfo.accountedSourceNodeReference !== null) {
							// compensate the accounted source node reference
							accountingInfo
								.accountedSourceNodeReference
								.compensateAggregatedSensorValues(
									compensation
								)

							switch (accountingInfo.type) {
								case 'accountToIntern':
									parentState
										.callIdentifier
										.sourceNode
										.compensateInternSensorValues(
											compensation
										)
								break
								case 'accountToExtern':
									parentState
										.callIdentifier
										.sourceNode
										.compensateExternSensorValues(
											compensation
										)
								break
								case 'accountToLangInternal':
									parentState
										.callIdentifier
										.sourceNode
										.compensateLangInternalSensorValues(
											compensation
										)
								break
								case 'accountOwnCodeGetsExecutedByExternal':
									throw new Error('InsertCPUProfileStateMachine.insertCPUNodes: compensation not supported for accountOwnCodeGetsExecutedByExternal')
								case null:
								break
								default:
									assertUnreachable(accountingInfo.type)
							}
						}
					}

					const parentStackFrame = stack[stack.length - 1]
					if (parentStackFrame !== undefined && parentStackFrame.result !== undefined) {
						if (parentStackFrame.result.compensation === undefined) {
							// carry upwards
							parentStackFrame.result.compensation = currentStackFrame.result.compensation
						} else {
							// add to existing compensation (also carried upwards)
							parentStackFrame.result.compensation.addToAggregated(
								compensation
							)
						}
						if (this.debug) {
							LoggerHelper.warn(
								'[COMPENSATION] carried upwards ' +
								`${compensation.aggregatedCPUTime} µs`
							)
							StateMachineLogger.logState(
								currentStackFrame.depth + 1,
								currentStackFrame.node,
								currentStackFrame.result.nextState
							)
						}
					}
				}

				if (this.debug) {
					StateMachineLogger.logLeaveTransition(
						currentStackFrame.result.nextState,
						currentStackFrame.state
					)
				}
				if (currentState.callIdentifier.isAwaiterSourceNode) {
					this.awaiterStack.pop()
				}
				continue
			}

			if (this.debug) {
				StateMachineLogger.logState(
					currentStackFrame.depth,
					currentStackFrame.node,
					currentStackFrame.state
				)
			}

			// determine the transition
			const transition = await InsertCPUProfileStateMachine.getTransition(
				currentStackFrame.state,
				currentStackFrame.node.sourceLocation,
				resolveFunctionIdentifierHelper
			)

			// apply the transition
			switch (transition.transition) {
				case 'toLangInternal':
					currentStackFrame.result = await this.accountToLangInternal(
						currentStackFrame.state,
						currentStackFrame.node,
						transition
					)
					break
				case 'toProject': {
					const scope = currentStackFrame.state.scope
					switch (scope) {
						case 'project':
							// transition stays in project
							currentStackFrame.result = await this.accountToIntern(
								currentStackFrame.state,
								currentStackFrame.node,
								transition
							)
							break
						case 'module':
							// transition from module to project
							currentStackFrame.result = await this.accountOwnCodeGetsExecutedByExternal(
								this.projectReport,
								currentStackFrame.node,
								transition
							)
							break
					}
				}
				break
				case 'toModule': {
					const scope = currentStackFrame.state.scope
					switch (scope) {
						case 'project':
							// transition from project to module
							currentStackFrame.result = await this.accountToExtern(
								currentStackFrame.state,
								currentStackFrame.node,
								transition
							)
							break
						case 'module':
							if (
								currentStackFrame.state.callIdentifier.report instanceof ModuleReport &&
								currentStackFrame.state.callIdentifier.report.nodeModule.identifier ===
									transition.options.nodeModule.identifier
							) {
								// transition stays in the same module
								currentStackFrame.result = await this.accountToIntern(
									currentStackFrame.state,
									currentStackFrame.node,
									transition
								)
							} else {
								// transition from module to different module
								currentStackFrame.result = await this.accountToExtern(
									currentStackFrame.state,
									currentStackFrame.node,
									transition
								)
							}
							break
					}
				}
				break
				case 'stayInState':
					// do nothing, stay in the current state
					currentStackFrame.result = {
						nextState: currentStackFrame.state,
						accountingInfo: null
					}
					break
				default:
					assertUnreachable(transition)
			}

			CompensationHelper.createCompensationIfNecessary(
				currentStackFrame.state,
				currentStackFrame.result
			)

			if (this.debug) {
				StateMachineLogger.logTransition(
					currentStackFrame.node,
					transition,
					currentStackFrame.result.accountingInfo,
					currentStackFrame.state,
					currentStackFrame.result.nextState
				)
			}

			// add children to stack
			for (const child of currentStackFrame.node.reversedChildren()) {
				stack.push({
					state: currentStackFrame.result.nextState,
					node: child,
					depth: currentStackFrame.depth + 1
				})
			}
		}
	}

	/**
	 * determine the transition based on the current state and the cpu node's source location
	 * 
	 * @param currentState the current state of the state machine
	 * 
	 * @param sourceLocation the source location of the incoming cpu node
	 * @returns the transition to the next state
	 */
	static async getTransition(
		currentState: State,
		sourceLocation: CPUProfileSourceLocation,
		resolveFunctionIdentifierHelper: ResolveFunctionIdentifierHelper
	): Promise<Transition> {
		if (sourceLocation.isLangInternal) {
			return {
				transition: 'toLangInternal' as const,
				options: {
					createLink: currentState.type !== 'lang_internal',
					headless: currentState.headless
				}
			}
		}
		if (sourceLocation.isWASM) {
			const wasmPath = new UnifiedPath(sourceLocation.rawUrl.substring(7)) // remove the 'wasm://' prefix

			return {
				transition: 'toModule' as const,
				options: {
					createLink: currentState.type !== 'lang_internal',
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					sourceNodeLocation: {
						relativeFilePath: wasmPath,
						functionIdentifier:
							sourceLocation.rawFunctionName as SourceNodeIdentifier_string
					},
					presentInOriginalSourceCode: false
				}
			}
		}
		if (!sourceLocation.isEmpty) {
			const {
				sourceNodeLocation,
				functionIdentifierPresentInOriginalFile,
				nodeModule,
				relativeNodeModulePath
			} = await resolveFunctionIdentifierHelper.resolveFunctionIdentifier(
				sourceLocation
			)

			if (!(relativeNodeModulePath && nodeModule)) {
				// is project
				return {
					transition: 'toProject' as const,
					options: {
						createLink: currentState.scope === 'project' && currentState.type === 'intern',
						headless: false,
						sourceNodeLocation: sourceNodeLocation,
						presentInOriginalSourceCode: functionIdentifierPresentInOriginalFile
					}
				}
			} else {
				// is module
				return {
					transition: 'toModule' as const,
					options: {
						createLink: currentState.type !== 'lang_internal',
						headless: false,
						nodeModule: nodeModule,
						sourceNodeLocation: sourceNodeLocation,
						presentInOriginalSourceCode: functionIdentifierPresentInOriginalFile
					}
				}
			}
		}

		return {
			transition: 'stayInState' as const
		}
	}

	// IMPORTANT to change when new measurement type gets added
	// if a node was already visited, set the aggregated measurements to 0
	// to avoid double counting of measurements
	sensorValuesForVisitedNode(
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
	async accountToLangInternal(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToLangInternalTransition
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

		if (transition.options.headless) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
			currentState.callIdentifier.report.lang_internalHeadlessSensorValues.addToSelf(sensorValues)
		}

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = this.sensorValuesForVisitedNode(
			sensorValues,
			this.callRelationTracker.isCallRecorded(currentCallIdentifier)
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal'
		)

		let accountedSourceNodeReference:
			SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> |
			null

		if (transition.options.createLink) {
			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToLangInternal: Current state has no source node assigned')
			}
			const alreadyLinked = this.callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)
			
			const accountedSensorValues = this.sensorValuesForVisitedNode(
				sensorValues,
				alreadyLinked
			)
			accountedSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToLangInternal(
				accountedSourceNode.globalIdentifier(),
				accountedSensorValues
			)
			accountedSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
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
				accountedProfilerHits: cpuNode.profilerHits,
				accountedSensorValues: accountedSensorValues,
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
	async accountToIntern(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToProjectTransition | ToModuleTransition,
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation

		let accountedSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> | null

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
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = this.sensorValuesForVisitedNode(
			sensorValues,
			this.callRelationTracker.isCallRecorded(currentCallIdentifier)
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		if (sourceNodeLocation.functionIdentifier === TypescriptHelper.awaiterSourceNodeIdentifier()) {
			currentCallIdentifier.isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the parentNodeInfo.sourceNode is null or of type lang internal
			// the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			this.awaiterStack.push({
				awaiter: accountedSourceNode,
				awaiterParent: currentState.callIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode ?
					(currentState.callIdentifier.sourceNode as
						SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>) :
					undefined
			})
		}

		if (
			!currentCallIdentifier.isAwaiterSourceNode &&
			this.awaiterStack.length > 0
		) {
			/*
				The current source node is not an awaiter
				but there is an awaiter in the source file and the current source node was called by it.
				If the current source node was already using the awaiter (as an intern call) in the call tree,
				subtract the current aggregated measurements, since they are already accounted
			*/
			const lastAwaiterNode = this.awaiterStack[this.awaiterStack.length - 1]
			if (lastAwaiterNode === undefined) {
				throw new Error('InsertCPUProfileHelper.accountToIntern: expected an awaiter in awaiterStack')
			}
			if (
				this.callRelationTracker.isCallRecorded(
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
			const alreadyLinked = this.callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)

			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}

			if (currentState.callIdentifier.sourceNode !== accountedSourceNode) {
				// only create a reference if its not a recursive call
				const accountedSensorValues = this.sensorValuesForVisitedNode(
					sensorValues,
					alreadyLinked
				)
				accountedSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToIntern(
					accountedSourceNode.globalIdentifier(),
					accountedSensorValues
				)
				accountedSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
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
				accountedProfilerHits: cpuNode.profilerHits,
				accountedSensorValues: accountedSensorValues,
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
	async accountToExtern(
		currentState: State,
		cpuNode: CPUNode,
		transition: ToModuleTransition,
	): Promise<{ nextState: State, accountingInfo: AccountingInfo }> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation
		const nodeModule = transition.options.nodeModule
		let accountedSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> | null

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
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = this.sensorValuesForVisitedNode(
			sensorValues,
			this.callRelationTracker.isCallRecorded(currentCallIdentifier)
		)
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'extern')

		if (transition.options.createLink) {
			if (currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}
			const alreadyLinked = this.callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				currentState.callIdentifier
			)

			const accountedSensorValues = this.sensorValuesForVisitedNode(
				sensorValues,
				alreadyLinked
			)
			accountedSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				accountedSensorValues
			)
			accountedSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
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
				accountedProfilerHits: cpuNode.profilerHits,
				accountedSensorValues: accountedSensorValues,
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
	async accountOwnCodeGetsExecutedByExternal(
		originalReport: ProjectReport,
		cpuNode: CPUNode,
		transition: ToProjectTransition,
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

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		const accountedSensorValues = this.sensorValuesForVisitedNode(
			sensorValues,
			this.callRelationTracker.isCallRecorded(currentCallIdentifier)
		)
		// add measurements to original source code
		accountedSourceNode.addToSensorValues(accountedSensorValues)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

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
				accountedProfilerHits: cpuNode.profilerHits,
				accountedSensorValues: accountedSensorValues,
				accountedSourceNodeReference: null
			}
		}
	}
}