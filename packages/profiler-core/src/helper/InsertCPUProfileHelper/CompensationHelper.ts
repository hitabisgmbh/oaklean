import { State } from './types/state'
import { TransitionResult } from './types/transition'
import { AccountingInfo, Compensation } from './types/accounting'
import { StateMachineLogger } from './StateMachineLogger'
import { StackFrame } from './types/stack'

import { CPUNode } from '../CPUProfile'
import { LoggerHelper } from '../LoggerHelper'
import { assertUnreachable } from '../../system/Switch'
import { SensorValues } from '../../model/SensorValues'
import { SourceNodeID_number } from '../../types'

let COMPENSATION_ID_COUNTER = 1

export class CompensationHelper {
	static addToCompensation(
		target: Compensation,
		add: Compensation
	) {
		target.total.addToAggregated(add.total)
		for (const [id, sensorValue] of add.compensationPerNode.entries()) {
			let existing = target.compensationPerNode.get(id)
			if (existing === undefined) {
				existing = new SensorValues({})
				target.compensationPerNode.set(
					id,
					existing
				)
			}
			existing.addToAggregated(sensorValue)
		}
	}

	static getAppliedCompensationForNode(
		compensation: Compensation,
		sourceNodeId: SourceNodeID_number
	) {
		const existing = compensation.compensationPerNode.get(sourceNodeId)
		if (existing === undefined) {
			return compensation.total
		}

		/*
		 * Rollback self compensation
		 * example: A -> B -> A
		 * since A already includes A in its aggregated sensor values,
		 * we need to rollback the compensation of A (that is included in the total)
		*/
		return compensation.total.clone().addToAggregated(
			existing,
			-1
		)
	}

	static createCompensationIfNecessary(
		node: CPUNode,
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
				
			const compensation: Compensation = {
				id: COMPENSATION_ID_COUNTER++,
				total: new SensorValues(
					node.sensorValues
				),
				compensationPerNode: new Map([
					[
						transitionResult.accountingInfo.accountedSourceNode.id,
						new SensorValues(node.sensorValues)
					]
				])
			}
			if (debug !== undefined) {
				StateMachineLogger.logCompensation(
					debug.depth,
					debug.node,
					currentState,
					compensation.total,
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

		const appliedCompensation = this.getAppliedCompensationForNode(
			compensation,
			parentState.callIdentifier.sourceNode.id
		)

		// the aggregated sensor values always needs to be compensated
		parentState.callIdentifier.sourceNode.compensateAggregatedSensorValues(
			appliedCompensation
		)

		if (debug !== undefined) {
			StateMachineLogger.logCompensation(
				debug.depth,
				debug.node,
				parentState,
				appliedCompensation,
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
			compensation.total
		)

		switch (accountingInfo.type) {
			case 'accountToIntern':
				parentState.callIdentifier.sourceNode.compensateInternSensorValues(
					compensation.total
				)
				break
			case 'accountToExtern':
				parentState.callIdentifier.sourceNode.compensateExternSensorValues(
					compensation.total
				)
				break
			case 'accountToLangInternal':
				parentState.callIdentifier.sourceNode.compensateLangInternalSensorValues(
					compensation.total
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
				CompensationHelper.addToCompensation(
					parentStackFrame.result.compensation,
					compensation
				)
			}
			if (debugInfo !== undefined) {
				LoggerHelper.log(
					LoggerHelper.warnString('[CARRY-COMPENSATION]') +
					` ${compensation.id} -> ${parentStackFrame.result.compensation.id}\n` +
						`├─ Compensation ID               : ${compensation.id}\n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Time              : total=${compensation.total.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Energy            : total=${compensation.total.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Carried RAM Energy            : total=${compensation.total.aggregatedRAMEnergyConsumption} µs \n` +
						`├─ Parent Compensation ID        : ${compensation.id}\n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Time   : self=${parentStackFrame.result.compensation.total.selfCPUTime} µs | total=${parentStackFrame.result.compensation.total.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Energy : self=${parentStackFrame.result.compensation.total.selfCPUEnergyConsumption} µs | total=${parentStackFrame.result.compensation.total.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated RAM Energy : self=${parentStackFrame.result.compensation.total.selfRAMEnergyConsumption} µs | total=${parentStackFrame.result.compensation.total.aggregatedRAMEnergyConsumption} µs \n`
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
