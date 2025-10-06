import { State } from './types/state'
import { TransitionResult } from './types/transition'
import { AccountingInfo } from './types/accounting'
import { StateMachineLogger } from './StateMachineLogger'
import { StackFrame } from './types/stack'

import { CPUNode } from '../CPUProfile'
import { LoggerHelper } from '../LoggerHelper'
import { assertUnreachable } from '../../system/Switch'
import { SensorValues } from '../../model/SensorValues'

export class CompensationHelper {
	static createCompensationIfNecessary(
		currentState: State,
		transitionResult: TransitionResult
	): SensorValues | undefined {
		if (
			// its not a stayInState transition
			transitionResult.accountingInfo !== null &&
			// no link was created
			transitionResult.accountingInfo.accountedSourceNodeReference === null &&
			// special case: lang_internal nodes never create links
			currentState.type !== 'lang_internal'
		) {
			// if no link is created, we treat this as a special case
			// this call is treated as if the call tree starts here
			//
			// since the current node was accounted with the full aggregated sensor values
			// without a reference being created, the current nodes sensor values do not add up
			// we need to compensate the accounted sensor values here
			// and in all its parents
			// so the compensation needs to be carried upwards
			return new SensorValues(
				transitionResult.accountingInfo.accountedSensorValues
			)
		}
	}

	/*
	 * Applies the given compensation to the parent state if it exists.
	 * The compensation is applied to the aggregated sensor values of the parent states source node.
	 * If the parent state has a link to an accounted source node reference,
	 * the compensation is also applied to the accounted source node reference.
	 * 
	 * Additionally, the compensation is applied to the specific sensor values
	 * (intern|extern|lang_internal) of the parent state depending on the accounting type.
	 * If no link was created (accountedSourceNodeReference is null), no compensation is applied.
	 * If the parent state has no source node (e.g. root), no compensation is applied.
	*/
	static applyCompensation(
		parentState: State,
		compensation: SensorValues,
		accountingInfo: AccountingInfo
	) {
		if (parentState.callIdentifier.sourceNode === null) {
			// parent source node does not exist (e.g. root)
			return
		}
		// the aggregated sensor values always need to be compensated
		parentState.callIdentifier.sourceNode.compensateAggregatedSensorValues(
			compensation
		)

		if (accountingInfo.accountedSourceNodeReference === null) {
			// no link was created, nothing more to compensate
			return
		}

		// only compensate (lang_internal|intern|extern) when there was a link created
		// compensate the accounted source node reference
		accountingInfo.accountedSourceNodeReference.compensateAggregatedSensorValues(
			compensation
		)

		switch (accountingInfo.type) {
			case 'accountToIntern':
				parentState.callIdentifier.sourceNode.compensateInternSensorValues(
					compensation
				)
				break
			case 'accountToExtern':
				parentState.callIdentifier.sourceNode.compensateExternSensorValues(
					compensation
				)
				break
			case 'accountToLangInternal':
				parentState.callIdentifier.sourceNode.compensateLangInternalSensorValues(
					compensation
				)
				break
			case 'accountOwnCodeGetsExecutedByExternal':
				throw new Error(
					'InsertCPUProfileStateMachine.insertCPUNodes: compensation not supported for accountOwnCodeGetsExecutedByExternal'
				)
			case null:
				break
			default:
				assertUnreachable(accountingInfo.type)
		}
	}

	/*
	 * Propagates the given compensation to the parent stack frame if it exists.
	 * If the parent stack frame already has a compensation, the given compensation
	 * is added to it.
	*/
	static propagateCompensation(
		parentStackFrame: StackFrame | undefined,
		compensation: SensorValues,
		debugInfo?: {
			depth: number
			node: CPUNode,
			currentState: State
		}
	) {
		if (
			parentStackFrame !== undefined &&
			parentStackFrame.result !== undefined
		) {
			if (parentStackFrame.result.compensation === undefined) {
				// carry upwards
				parentStackFrame.result.compensation = compensation
			} else {
				// add to existing compensation (also carried upwards)
				parentStackFrame.result.compensation.addToAggregated(compensation)
			}
			if (debugInfo !== undefined) {
				LoggerHelper.warn(
					'[COMPENSATION] carried upwards ' +
						`${compensation.aggregatedCPUTime} µs`
				)
				StateMachineLogger.logState(
					debugInfo.depth + 1,
					debugInfo.node,
					debugInfo.currentState
				)
			}
		}
	}
}
