import { State } from './types/state'
import { TransitionResult } from './types/transition'
import { AccountingInfo, Compensation } from './types/accounting'
import { StateMachineLogger } from './StateMachineLogger'
import { StackFrame } from './types/stack'

import { CPUNode } from '../CPUProfile'
import { LoggerHelper } from '../LoggerHelper'
import { assertUnreachable } from '../../system/Switch'
import { SensorValues } from '../../model/SensorValues'

let COMPENSATION_ID_COUNTER = 1

export class CompensationHelper {
	static createCompensationIfNecessary(
		currentState: State,
		transitionResult: TransitionResult,
		debug?: {
			depth: number,
			node: CPUNode
		}
	): Compensation | undefined {
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
			const compensation = {
				id: COMPENSATION_ID_COUNTER++,
				sensorValues: new SensorValues(
					transitionResult.accountingInfo.accountedSensorValues
				)
			}
			if (debug !== undefined) {
				StateMachineLogger.logCompensation(
					debug.depth,
					debug.node,
					currentState,
					compensation,
					'CREATE COMPENSATION'
				)
			}
			return compensation
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
		compensation: Compensation,
		accountingInfo: AccountingInfo,
		debug?: {
			depth: number,
			node: CPUNode
		}
	) {
		if (parentState.callIdentifier.sourceNode === null) {
			// parent source node does not exist (e.g. root)
			return
		}
		// the aggregated sensor values always need to be compensated
		parentState.callIdentifier.sourceNode.compensateAggregatedSensorValues(
			compensation.sensorValues
		)
		if (debug !== undefined) {
			StateMachineLogger.logCompensation(
				debug.depth,
				debug.node,
				parentState,
				compensation,
				'APPLY COMPENSATION'
			)
		}

		if (accountingInfo.accountedSourceNodeReference === null) {
			// no link was created, nothing more to compensate
			return
		}

		// only compensate (lang_internal|intern|extern) when there was a link created
		// compensate the accounted source node reference
		accountingInfo.accountedSourceNodeReference.compensateAggregatedSensorValues(
			compensation.sensorValues
		)

		switch (accountingInfo.type) {
			case 'accountToIntern':
				parentState.callIdentifier.sourceNode.compensateInternSensorValues(
					compensation.sensorValues
				)
				break
			case 'accountToExtern':
				parentState.callIdentifier.sourceNode.compensateExternSensorValues(
					compensation.sensorValues
				)
				break
			case 'accountToLangInternal':
				parentState.callIdentifier.sourceNode.compensateLangInternalSensorValues(
					compensation.sensorValues
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
		compensation: Compensation,
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
				parentStackFrame.result.compensation.sensorValues.addToAggregated(compensation.sensorValues)
			}
			if (debugInfo !== undefined) {
				LoggerHelper.log(
					LoggerHelper.warnString('[CARRY-COMPENSATION]') +
					` ${compensation.id} -> ${parentStackFrame.result.compensation.id}\n` +
						`├─ Compensation ID               : ${compensation.id}\n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Time              : total=${compensation.sensorValues.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Energy            : total=${compensation.sensorValues.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Carried RAM Energy            : total=${compensation.sensorValues.aggregatedRAMEnergyConsumption} µs \n` +
						`├─ Parent Compensation ID        : ${compensation.id}\n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Time   : self=${parentStackFrame.result.compensation.sensorValues.selfCPUTime} µs | total=${parentStackFrame.result.compensation.sensorValues.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Energy : self=${parentStackFrame.result.compensation.sensorValues.selfCPUEnergyConsumption} µs | total=${parentStackFrame.result.compensation.sensorValues.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated RAM Energy : self=${parentStackFrame.result.compensation.sensorValues.selfRAMEnergyConsumption} µs | total=${parentStackFrame.result.compensation.sensorValues.aggregatedRAMEnergyConsumption} µs \n`
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
