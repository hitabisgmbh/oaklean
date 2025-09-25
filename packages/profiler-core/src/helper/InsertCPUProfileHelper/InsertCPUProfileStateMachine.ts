import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'

import { CPUNode } from '../CPUProfile'
import { ResolveFunctionIdentifierHelper } from '../ResolveFunctionIdentifierHelper'
import { GlobalIdentifier, UnifiedPath } from '../../system'
import { ProjectReport } from '../../model/ProjectReport'
import { NodeModule } from '../../model/NodeModule'
import { SourceNodeMetaData } from '../../model/SourceNodeMetaData'
// Types
import {
	ISensorValues,
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	MicroSeconds_number,
	MilliJoule_number,
	ResolvedSourceNodeLocation,
	SourceNodeMetaDataType
} from '../../types'
import { ExternalResourceHelper } from '../ExternalResourceHelper'
import { TypescriptHelper } from '../TypescriptParser'

type StateProps = {
	type: 'intern'
	headless: false
	callIdentifier: CallIdentifier
} | {
	type: 'lang_internal'
	headless: boolean
	callIdentifier: CallIdentifier
}

type ProjectState = StateProps & {
	scope: 'project'
}

type ModuleState = StateProps & {
	scope: 'module'
}

export type State = ProjectState | ModuleState

type TransitionOptions = {
	createLink: boolean
	headless: boolean
}

type SourceLocationTransitionOptions = {
	sourceNodeLocation: ResolvedSourceNodeLocation
	presentInOriginalSourceCode: boolean
}

type ProjectTransitionOptions = TransitionOptions & SourceLocationTransitionOptions

type ModuleTransitionOptions = TransitionOptions & SourceLocationTransitionOptions & {
	nodeModule: NodeModule
}

type ToProjectTransition = {
	transition: 'toProject'
	options: ProjectTransitionOptions
}

type ToLangInternalTransition = {
	transition: 'toLangInternal'
	options: TransitionOptions
}

type ToModuleTransition = { 
	transition: 'toModule'
	options: ModuleTransitionOptions
}

export type Transition = 
	ToProjectTransition |
	ToLangInternalTransition |
	ToModuleTransition | {
		transition: 'stayInState'
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
	rootDir: UnifiedPath
	projectReport: ProjectReport

	callRelationTracker: CallRelationTracker
	awaiterStack: AwaiterStack

	constructor(
		rootDir: UnifiedPath,
		reportToApply: ProjectReport,
	) {
		this.rootDir = rootDir
		this.projectReport = reportToApply
		this.callRelationTracker = new CallRelationTracker()
		this.awaiterStack = []
	}
			scope: 'project',
			type: 'lang_internal',
			headless: true,
			callIdentifier: new CallIdentifier(
				reportToApply,
				null
			)
		}
	}

	/**
	 * determine the transition based on the current state and the cpu node's source location
	 * 
	 * @param currentState the current state of the state machine
	 * 
	 * @param cpuNode the new cpu node (that should be inserted)
	 * @returns the transition to the next state
	 */
	static async getTransition(
		currentState: State,
		cpuNode: CPUNode,
		resolveFunctionIdentifierHelper: ResolveFunctionIdentifierHelper
	): Promise<Transition> {
		if (cpuNode.sourceLocation.isLangInternal) {
			return {
				transition: 'toLangInternal' as const,
				options: {
					createLink: currentState.type !== 'lang_internal',
					headless: currentState.headless
				}
			}
		}
		if (cpuNode.sourceLocation.isWASM) {
			const wasmPath = new UnifiedPath(cpuNode.sourceLocation.rawUrl.substring(7)) // remove the 'wasm://' prefix

			return {
				transition: 'toModule' as const,
				options: {
					createLink: currentState.type !== 'lang_internal',
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					sourceNodeLocation: {
						relativeFilePath: wasmPath,
						functionIdentifier:
							cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
					},
					presentInOriginalSourceCode: false
				}
			}
		}
		if (!cpuNode.sourceLocation.isEmpty) {
			const {
				sourceNodeLocation,
				functionIdentifierPresentInOriginalFile,
				nodeModule,
				relativeNodeModulePath
			} = await resolveFunctionIdentifierHelper.resolveFunctionIdentifier(
				cpuNode.sourceLocation
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
		cpuNode: CPUNode,
		transition: ToLangInternalTransition
	): Promise<State> {
		const sensorValues = cpuNode.sensorValues

		const accountedSourceNode = this.currentState.callIdentifier.report.addToLangInternal(
			cpuNode.sourceLocation.rawUrl as LangInternalPath_string,
			cpuNode.sourceLocation.sourceNodeIdentifier as LangInternalSourceNodeIdentifier_string
		)
		const currentCallIdentifier = new CallIdentifier(
			this.currentState.callIdentifier.report,
			accountedSourceNode
		)

		if (transition.options.headless) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
			this.currentState.callIdentifier.report.lang_internalHeadlessSensorValues.addToSelf(sensorValues)
		}

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits

		accountedSourceNode.addToSensorValues(
			this.sensorValuesForVisitedNode(
				sensorValues,
				this.callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal'
		)

		let currentSourceNodeReference: SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> 
		if (transition.options.createLink) {
			if (this.currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToLangInternal: Current state has no source node assigned')
			}
			const alreadyLinked = this.callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				this.currentState.callIdentifier
			)
			
			currentSourceNodeReference = this.currentState.callIdentifier.sourceNode.addSensorValuesToLangInternal(
				accountedSourceNode.globalIdentifier(),
				this.sensorValuesForVisitedNode(
					sensorValues,
					alreadyLinked
				)
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			scope: this.currentState.scope,
			type: 'lang_internal',
			headless: transition.options.headless,
			callIdentifier: currentCallIdentifier
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
		cpuNode: CPUNode,
		transition: ToProjectTransition | ToModuleTransition,
	): Promise<State> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation

		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> | undefined = undefined

		// intern
		const accountedSourceNode = this.currentState.callIdentifier.report.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = new CallIdentifier(
			this.currentState.callIdentifier.report,
			accountedSourceNode
		)
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		accountedSourceNode.addToSensorValues(
			this.sensorValuesForVisitedNode(
				sensorValues,
				this.callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

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
				awaiterParent: this.currentState.callIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode ?
					(this.currentState.callIdentifier.sourceNode as
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
						this.currentState.callIdentifier.report,
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
				this.currentState.callIdentifier
			)

			if (this.currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}

			if (this.currentState.callIdentifier.sourceNode !== accountedSourceNode) {
				// only create a reference if its not a recursive call
				currentSourceNodeReference = this.currentState.callIdentifier.sourceNode.addSensorValuesToIntern(
					accountedSourceNode.globalIdentifier(),
					this.sensorValuesForVisitedNode(
						sensorValues,
						alreadyLinked
					)
				)
				currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
			}
		}

		return {
			scope: transition.transition === 'toProject' ? 'project' : 'module',
			type: 'intern',
			headless: false,
			callIdentifier: currentCallIdentifier
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
		cpuNode: CPUNode,
		transition: ToModuleTransition,
	): Promise<State> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation
		const nodeModule = transition.options.nodeModule
		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> | undefined = undefined

		const globalIdentifier = new GlobalIdentifier(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
			nodeModule
		)

		// extern
		const { report, sourceNodeMetaData } = this.currentState.callIdentifier.report.addToExtern(
			sourceNodeLocation.relativeFilePath,
			nodeModule,
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = new CallIdentifier(
			report,
			sourceNodeMetaData
		)
		sourceNodeMetaData.sensorValues.profilerHits += cpuNode.profilerHits
		sourceNodeMetaData.addToSensorValues(
			this.sensorValuesForVisitedNode(
				sensorValues,
				this.callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'extern')

		if (transition.options.createLink) {
			if (this.currentState.callIdentifier.sourceNode === null) {
				throw new Error('InsertCPUProfileStateMachine.accountToIntern: Current state has no source node assigned')
			}
			const alreadyLinked = this.callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				this.currentState.callIdentifier
			)

			currentSourceNodeReference = this.currentState.callIdentifier.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				this.sensorValuesForVisitedNode(
					sensorValues,
					alreadyLinked
				)
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			scope: 'module',
			type: 'intern',
			headless: false,
			callIdentifier: currentCallIdentifier
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
	): Promise<State> {
		const sensorValues = cpuNode.sensorValues
		const sourceNodeLocation = transition.options.sourceNodeLocation

		const accountedSourceNode = originalReport.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
		)
		const currentCallIdentifier = new CallIdentifier(
			originalReport,
			accountedSourceNode
		)

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		// add measurements to original source code
		accountedSourceNode.addToSensorValues(
			this.sensorValuesForVisitedNode(
				sensorValues,
				this.callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		currentCallIdentifier.firstTimeVisited = this.callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		if (transition.options.createLink) {
			throw new Error('InsertCPUProfileStateMachine.accountOwnCodeGetsExecutedByExternal: Cannot create link to parent, since the parent call is from a different report')
		}

		return {
			scope: 'project',
			type: 'intern',
			headless: false,
			callIdentifier: currentCallIdentifier
		}
	}
}