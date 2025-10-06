import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'
import { State } from './types/state'
import {
	Transition,
	TransitionResult
} from './types/transition'
import { StackFrame, AwaiterStack } from './types/stack'
import { StateMachineLogger } from './StateMachineLogger'
import { CompensationHelper } from './CompensationHelper'
import { AccountingHelper } from './AccountingHelper'

import { assertUnreachable } from '../../system/Switch'
import { CPUModel } from '../CPUProfile/CPUModel'
import { CPUNode } from '../CPUProfile/CPUNode'
import { ResolveFunctionIdentifierHelper } from '../ResolveFunctionIdentifierHelper'
import { UnifiedPath } from '../../system'
import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import { WASM_NODE_MODULE } from '../../model/NodeModule'
import { MetricsDataCollection } from '../../model/interfaces/MetricsDataCollection'
import { ICpuProfileRaw } from '../../../lib/vscode-js-profile-core/src/cpu/types'
// Types
import {
	NanoSeconds_BigInt,
	SourceNodeIdentifier_string
} from '../../types'
import { CPUProfileSourceLocation } from '../CPUProfile'

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

			// POSTPROCESSING OF THE NODE (second visit)
			if (currentStackFrame.result !== undefined) {
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
					// last occurrence of the callIdentifier in the call stack
					// remove it from the call relation tracker
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
					// apply the compensation to the current state
					CompensationHelper.applyCompensation(
						parentState,
						compensation,
						accountingInfo
					)

					// propagate the compensation to all parents
					CompensationHelper.propagateCompensation(
						stack[stack.length - 1],
						compensation,
						this.debug ? {
							depth: currentStackFrame.depth + 1,
							node: currentStackFrame.node,
							currentState
						} : undefined
					)
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

			// PROCESSING OF THE NODE (first visit)
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
			currentStackFrame.result = await this.applyTransition(
				currentStackFrame,
				transition
			)

			// create compensation if necessary
			currentStackFrame.result.compensation = CompensationHelper.createCompensationIfNecessary(
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

	async applyTransition(
		currentStackFrame: StackFrame,
		transition: Transition
	): Promise<TransitionResult> {
		switch (transition.transition) {
			case 'toLangInternal':
				return await AccountingHelper.accountToLangInternal(
					currentStackFrame.state,
					currentStackFrame.node,
					transition,
					this.callRelationTracker
				)
			case 'toProject': {
				const scope = currentStackFrame.state.scope
				switch (scope) {
					case 'project':
						// transition stays in project
						return await AccountingHelper.accountToIntern(
							currentStackFrame.state,
							currentStackFrame.node,
							transition,
							this.callRelationTracker,
							this.awaiterStack
						)
					case 'module':
						// transition from module to project
						return await AccountingHelper.accountOwnCodeGetsExecutedByExternal(
							this.projectReport,
							currentStackFrame.node,
							transition,
							this.callRelationTracker
						)
				}
			}
			break
			case 'toModule': {
				const scope = currentStackFrame.state.scope
				switch (scope) {
					case 'project':
						// transition from project to module
						return await AccountingHelper.accountToExtern(
							currentStackFrame.state,
							currentStackFrame.node,
							transition,
							this.callRelationTracker
						)
					case 'module':
						if (
							currentStackFrame.state.callIdentifier.report instanceof ModuleReport &&
							currentStackFrame.state.callIdentifier.report.nodeModule.identifier ===
								transition.options.nodeModule.identifier
						) {
							// transition stays in the same module
							return await AccountingHelper.accountToIntern(
								currentStackFrame.state,
								currentStackFrame.node,
								transition,
								this.callRelationTracker,
								this.awaiterStack
							)
						} else {
							// transition from module to different module
							return await AccountingHelper.accountToExtern(
								currentStackFrame.state,
								currentStackFrame.node,
								transition,
								this.callRelationTracker
							)
						}
				}
			}
			break
			case 'stayInState':
				// do nothing, stay in the current state
				return {
					nextState: currentStackFrame.state,
					accountingInfo: null
				}
			default:
				assertUnreachable(transition)
		}
	}
}