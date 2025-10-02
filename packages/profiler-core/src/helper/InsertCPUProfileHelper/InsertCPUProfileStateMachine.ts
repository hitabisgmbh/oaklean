import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'

import { SensorValues } from '../../model/SensorValues'
import { CPUModel } from '../CPUProfile/CPUModel'
import { CPUNode } from '../CPUProfile/CPUNode'
import { ResolveFunctionIdentifierHelper } from '../ResolveFunctionIdentifierHelper'
import { GlobalIdentifier, UnifiedPath } from '../../system'
import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import { NodeModule, WASM_NODE_MODULE } from '../../model/NodeModule'
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
	ResolvedSourceNodeLocation,
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

export type AccountingType =
	| 'accountToLangInternal'
	| 'accountToIntern'
	| 'accountToExtern'
	| 'accountOwnCodeGetsExecutedByExternal'

export type AccountingInfo = {
	type: AccountingType
	accountedProfilerHits: number
	accountedSensorValues: ISensorValues
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
		type StackFrame = {
			state: State,
			node: CPUNode,
			depth: number,
			result?: {
				transition: Transition,
				nextState: State,
				compensation?: SensorValues
			}
		}

		const beginState: State = {
			scope: 'project',
			type: 'lang_internal',
			headless: true,
			callIdentifier: new CallIdentifier(
				this.projectReport,
				null
			)
		}

		const stack: StackFrame[] = [
			{
				state: beginState,
				node: rootNode,
				depth: 0
			}]

		while (stack.length > 0) {
			const currentStackFrame = stack[stack.length - 1]

			if (currentStackFrame.result) {
				stack.pop()
				if (currentStackFrame.result.transition.transition === 'stayInState') {
					continue
				}
				
				const parentCallIdentifier = currentStackFrame.state.callIdentifier

				// this node (currentStackFrame.result.nextState):
				// is about to get left (all children have been processed)
				const accountedCallIdentifier = currentStackFrame.result.nextState.callIdentifier

				if (currentStackFrame.result.transition.options.createLink) {
					// remove the last child call from the current state
					if (!this.callRelationTracker.removeLastChildRecord(parentCallIdentifier)) {
						throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: expected childCalls to be present')
					}
				}
				if (accountedCallIdentifier.firstTimeVisited) {
					this.callRelationTracker.removeCallRecord(accountedCallIdentifier)
				}
				if (this.debug) {
					this.logState(
						currentStackFrame.depth + 1,
						currentStackFrame.node,
						currentStackFrame.result.nextState
					)
				}
				if (currentStackFrame.result.compensation !== undefined) {
					// apply compensation and carry it upwards
					currentStackFrame.state.callIdentifier.sourceNode?.compensateAggregatedSensorValues(
						currentStackFrame.result.compensation
					)

					const parentStackFrame = stack[stack.length - 1]
					if (parentStackFrame !== undefined && parentStackFrame.result !== undefined) {
						if (parentStackFrame.result.compensation === undefined) {
							// carry upwards
							parentStackFrame.result.compensation = currentStackFrame.result.compensation
						} else {
							// add to existing compensation (also carried upwards)
							parentStackFrame.result.compensation.addToAggregated(
								currentStackFrame.result.compensation
							)
						}
						if (this.debug) {
							LoggerHelper.warn(
								'[COMPENSATION] carried upwards ' +
								`${currentStackFrame.result.compensation.aggregatedCPUTime} µs`
							)
							this.logState(
								currentStackFrame.depth + 1,
								currentStackFrame.node,
								currentStackFrame.result.nextState
							)
						}
					}
				}

				if (this.debug) {
					this.logLeaveTransition(
						currentStackFrame.result.nextState,
						currentStackFrame.state
					)
				}
				if (accountedCallIdentifier.isAwaiterSourceNode) {
					this.awaiterStack.pop()
				}
				continue
			}

			if (this.debug) {
				this.logState(
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

			let transitionResult: {
				nextState: State,
				accountingInfo: AccountingInfo | null
			}
			// apply the transition
			switch (transition.transition) {
				case 'toLangInternal':
					transitionResult = await this.accountToLangInternal(
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
							transitionResult = await this.accountToIntern(
								currentStackFrame.state,
								currentStackFrame.node,
								transition
							)
							break
						case 'module':
							// transition from module to project
							transitionResult = await this.accountOwnCodeGetsExecutedByExternal(
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
							transitionResult = await this.accountToExtern(
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
								transitionResult = await this.accountToIntern(
									currentStackFrame.state,
									currentStackFrame.node,
									transition
								)
							} else {
								// transition from module to different module
								transitionResult = await this.accountToExtern(
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
					transitionResult = {
						nextState: currentStackFrame.state,
						accountingInfo: null
					}
					break
				default:
					assertUnreachable(transition)
			}

			currentStackFrame.result = {
				transition,
				nextState: transitionResult.nextState
			}

			if (
				transition.transition !== 'stayInState' &&
				transition.options.createLink === false &&
				// special case: lang_internal nodes never create links
				currentStackFrame.state.type !== 'lang_internal' &&
				transitionResult.accountingInfo !== null
			) {
				// if no link is created, we treat this as a special case
				// this call is treated as if the call tree starts here
				// 
				// since the current node was accounted with the full aggregated sensor values
				// without a reference being created, the current nodes sensor values do not add up
				// we need to compensate the accounted sensor values here
				// and in all its parents
				// so the compensation needs to be carried upwards
				currentStackFrame.result.compensation = new SensorValues(
					transitionResult.accountingInfo.accountedSensorValues
				)
			}

			if (this.debug) {
				this.logTransition(
					currentStackFrame.node,
					transition,
					transitionResult.accountingInfo,
					currentStackFrame.state,
					transitionResult.nextState
				)
			}

			// add children to stack
			for (const child of currentStackFrame.node.reversedChildren()) {
				stack.push({
					state: transitionResult.nextState,
					node: child,
					depth: currentStackFrame.depth + 1
				})
			}
		}
	}

	formatState = LoggerHelper.treeStyleKeyValues([
		'Depth',
		'CPU Node',
		'ReportID',
		'SourceNodeID',
		'Scope',
		'Type',
		'Headless',
		'Profiler Hits',
		'CPU Time',
		'CPU Energy',
		'RAM Energy'
	] as const)

	logState(
		depth: number,
		cpuNode: CPUNode,
		currentState: State
	) {
		/*
			[STATE] moduleFunction_fileA_0 (./fileA.js)
			├─ Depth         : 1
			├─ CPU Node      : 001
			├─ ReportID      : 1
			├─ SourceNodeID  : 3
			├─ Scope         : module
			├─ Type          : intern
			├─ Headless      : false
			├─ Profiler Hits : 2
			├─ CPU Time      : self=20 µs | total=30 µs
			├─ CPU Energy    : self=0 mJ | total=0 mJ
			├─ RAM Energy    : self=0 mJ | total=0 mJ
		*/
		if (currentState.callIdentifier.sourceNode === null) {
			LoggerHelper.log(
				LoggerHelper.successString('[STATE]'),
				'(root)'
			)
			return
		}

		const sourceNodeIndex = currentState.callIdentifier.sourceNode?.getIndex()
		if (sourceNodeIndex === undefined) {
			throw new Error('InsertCPUProfileStateMachine.logState: sourceNode has no index')
		}

		const sensorValues = currentState.callIdentifier.sourceNode.sensorValues
		
		LoggerHelper.log(
			LoggerHelper.successString('[STATE]'),
			`${sourceNodeIndex.functionName}`,
			`(${sourceNodeIndex.pathIndex.identifier})`, '\n' +
			this.formatState({
				'Depth': depth.toString(),
				'CPU Node': String(cpuNode.index).padStart(3, '0'),
				'ReportID': currentState.callIdentifier.report.internID.toString(),
				'SourceNodeID': currentState.callIdentifier.sourceNode.id.toString(),
				'Scope': currentState.scope,
				'Type': currentState.type,
				'Headless': currentState.headless.toString(),
				'Profiler Hits': `${sensorValues.profilerHits}`,
				'CPU Time': `self=${sensorValues.selfCPUTime} µs | total=${sensorValues.aggregatedCPUTime} µs`,
				'CPU Energy': `self=${sensorValues.selfCPUEnergyConsumption} mJ | total=${sensorValues.aggregatedCPUEnergyConsumption} mJ`,
				'RAM Energy': `self=${sensorValues.selfRAMEnergyConsumption} mJ | total=${sensorValues.aggregatedRAMEnergyConsumption} mJ`
			})
		)
	}

	logLeaveTransition(
		currentState: State,
		nextState: State,
	) {
		const currentSourceNodeIndex = currentState.callIdentifier.sourceNode?.getIndex()

		const currentSourceNodeName = currentSourceNodeIndex !== undefined ?
			currentSourceNodeIndex.functionName :
			'(root)'
		
		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName = nextSourceNodeIndex !== undefined ?
			nextSourceNodeIndex.functionName :
			'(root)'

		LoggerHelper.log(
			LoggerHelper.errorString('[LEAVE TRANSITION]'),
			`${currentSourceNodeName}`,
			LoggerHelper.successString(`${currentState.callIdentifier.firstTimeVisited ? '[last-occurrence-in-tree]' : ''}`),
			`-> ${nextSourceNodeName}`
		)
	}

	formatTransition = LoggerHelper.treeStyleKeyValues([
		'CPU Node',
		'Transition',
		'Create Link',
		'AccountingType',
		'FirstTimeVisited',
		'Accounted Hits',
		'Accounted CPU Time',
		'Accounted CPU Energy',
		'Accounted RAM Energy'
	] as const)

	logTransition(
		cpuNode: CPUNode,
		transition: Transition,
		accountingInfo: AccountingInfo | null,
		currentState: State,
		nextState: State
	) {
		/*
			 [TRANSITION] (root) -> moduleFunction_fileA_0
				├─ CPU Node             : 000
				├─ Transition           : toModule
				├─ AccountingType       : accountToExtern
				├─ FirstTimeVisited     : true
				├─ Accounted Hits       : 2
				├─ Accounted CPU Time   : self=20 µs | total=30 µs
				├─ Accounted CPU Energy : self=0 mJ | total=0 mJ
				├─ Accounted RAM Energy : self=0 mJ | total=0 mJ
		*/
		const currentSourceNodeIndex = currentState.callIdentifier.sourceNode?.getIndex()
		const currentSourceNodeName = currentSourceNodeIndex !== undefined ?
			currentSourceNodeIndex.functionName :
			'(root)'


		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName = nextSourceNodeIndex !== undefined ?
			nextSourceNodeIndex.functionName :
			'(root)'

		LoggerHelper.log(
			LoggerHelper.warnString('[TRANSITION]'),
			`${currentSourceNodeName} -> ${nextSourceNodeName}`, '\n' +
			this.formatTransition({
				'CPU Node': String(cpuNode.index).padStart(3, '0'),
				'Transition': transition.transition,
				'Create Link': transition.transition === 'stayInState' ? 'false' : transition.options.createLink.toString(),
				'AccountingType': accountingInfo === null ? 'styInState' : accountingInfo?.type,
				'FirstTimeVisited': nextState.callIdentifier.firstTimeVisited.toString(),
				'Accounted Hits': `${accountingInfo?.accountedProfilerHits}`,
				'Accounted CPU Time': `self=${accountingInfo?.accountedSensorValues.selfCPUTime || 0} µs | total=${accountingInfo?.accountedSensorValues.aggregatedCPUTime || 0} µs`,
				'Accounted CPU Energy': `self=${accountingInfo?.accountedSensorValues.selfCPUEnergyConsumption || 0} mJ | total=${accountingInfo?.accountedSensorValues.aggregatedCPUEnergyConsumption || 0} mJ`,
				'Accounted RAM Energy': `self=${accountingInfo?.accountedSensorValues.selfRAMEnergyConsumption || 0} mJ | total=${accountingInfo?.accountedSensorValues.aggregatedRAMEnergyConsumption || 0} mJ`
			})
		)
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

		let currentSourceNodeReference: SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> 
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
			currentSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToLangInternal(
				accountedSourceNode.globalIdentifier(),
				accountedSensorValues
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
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
				accountedSensorValues: accountedSensorValues
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

		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> | undefined = undefined

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
				currentSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToIntern(
					accountedSourceNode.globalIdentifier(),
					accountedSensorValues
				)
				currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
			}
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
				accountedSensorValues: accountedSensorValues
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
		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> | undefined = undefined

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
			currentSourceNodeReference = currentState.callIdentifier.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				accountedSensorValues
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
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
				accountedSensorValues: accountedSensorValues
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
				accountedSensorValues: accountedSensorValues
			}
		}
	}
}