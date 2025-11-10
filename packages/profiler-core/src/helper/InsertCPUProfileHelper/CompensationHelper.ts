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
	static createCompForParent(
		compensation: Compensation
	): Compensation {
		// compensation to be carried upwards
		// id stays the same
		// but createdComp is set to null
		return {
			id: compensation.id,
			createdComp: null,
			// if createdComp is null, just carry the existing carriedComp upwards
			carriedComp: compensation.createdComp || compensation.carriedComp
		}
	}

	static addToCompensation(
		target: Compensation,
		add: Compensation
	) {
		target.carriedComp = SensorValues.sum(
			target.carriedComp,
			add.createdComp || add.carriedComp
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
				createdComp: new SensorValues(
					node.sensorValues
				),
				carriedComp: new SensorValues({})
			}
			if (debug !== undefined) {
				StateMachineLogger.logCompensation(
					debug.depth,
					debug.node,
					transitionResult.nextState,
					compensation,
					'CREATE COMPENSATION'
				)
			}
			return compensation
		}
	}

	/*
	 * A -> B (a: parent, b: current)
	 * 
	 * Compensates:
	 *  - B
	 *  - A.(intern|extern|lang_internal)
	 *  - A.accountedSourceNodeReference
	 * 
	*/
	static applyCompensation(
		node: CPUNode,
		currentState: State,
		parentState: State,
		compensation: Compensation,
		accountingInfo: AccountingInfo,
		debug?: {
			depth: number
		}
	) {

		if (accountingInfo.accountedSourceNode.firstTimeVisited) {
			// only compensate the accounted source node if its the first occurrence in the call tree (from the root)
			accountingInfo.accountedSourceNode.node.sensorValues.addToAggregated(
				compensation.carriedComp,
				-1
			)
		} else if (accountingInfo.accountedSourceNode.firstTimeInCurrentCompensationLayer) {
			// if its not the first time visited, but the first time in the current compensation layer
			// we need to add the currents cpu node's aggregated sensor values
			// to prevent double compensation
			accountingInfo.accountedSourceNode.node.sensorValues.addToAggregated(
				compensation.carriedComp.clone().addToAggregated(
					node.sensorValues,
					-1
				),
				-1
			)
		}

		if (accountingInfo.accountedSourceNodeReference === null) {
			// no link was created, nothing more to compensate
			return
		}

		if (debug !== undefined) {
			StateMachineLogger.logCompensation(
				debug.depth,
				node,
				currentState,
				compensation,
				'APPLY COMPENSATION'
			)
		}

		// if the current reference was already visited before
		// we need to add the currents cpu node's aggregated sensor values
		// to prevent double compensation
		const referenceCompensation = accountingInfo.accountedSourceNodeReference.firstTimeVisited ?
			compensation.carriedComp :
			compensation.carriedComp.clone().addToAggregated(
				node.sensorValues,
				-1
			)

		if (accountingInfo.accountedSourceNodeReference.reference === undefined) {
			return
		}

		if (debug !== undefined) {
			LoggerHelper.warn(`[REFERENCE-COMPENSATION] ${accountingInfo.accountedSourceNodeReference.reference.id}`)
		}

		// only compensate (lang_internal|intern|extern) when there was a link created
		// compensate the accounted source node reference
		accountingInfo.accountedSourceNodeReference.reference.sensorValues.addToAggregated(
			referenceCompensation,
			-1
		)

		if (parentState.callIdentifier.sourceNode === null) {
			// parent source node does not exist (e.g. root)
			return
		}

		switch (accountingInfo.type) {
			case 'accountToIntern':
				parentState.callIdentifier.sourceNode.sensorValues.addToIntern(
					referenceCompensation,
					-1
				)
				break
			case 'accountToExtern':
				parentState.callIdentifier.sourceNode.sensorValues.addToExtern(
					referenceCompensation,
					-1
				)
				break
			case 'accountToLangInternal':
				parentState.callIdentifier.sourceNode.sensorValues.addToLangInternal(
					referenceCompensation,
					-1
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
				parentStackFrame.result.compensation = CompensationHelper.createCompForParent(
					compensation
				)
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
						`├─ CPU Node                      : ${debugInfo.node.index}\n` + 
						`├─ Compensation ID               : ${compensation.id}\n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Time              : created=${compensation.createdComp?.aggregatedCPUTime} | µs carried=${compensation.carriedComp.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Carried CPU Energy            : created=${compensation.createdComp?.aggregatedCPUEnergyConsumption} | carried=${compensation.carriedComp.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Carried RAM Energy            : created=${compensation.createdComp?.aggregatedRAMEnergyConsumption} | carried=${compensation.carriedComp.aggregatedRAMEnergyConsumption} µs \n` +
						`├─ Parent Compensation ID        : ${compensation.id}\n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Time   : created=${parentStackFrame.result.compensation.createdComp?.aggregatedCPUTime} µs | carried=${parentStackFrame.result.compensation.carriedComp.aggregatedCPUTime} µs \n` + 
						// eslint-disable-next-line max-len
						`├─ Parent Compensated CPU Energy : created=${parentStackFrame.result.compensation.createdComp?.aggregatedCPUEnergyConsumption} µs | carried=${parentStackFrame.result.compensation.carriedComp.aggregatedCPUEnergyConsumption} µs \n` +
						// eslint-disable-next-line max-len
						`├─ Parent Compensated RAM Energy : created=${parentStackFrame.result.compensation.createdComp?.aggregatedRAMEnergyConsumption} µs | carried=${parentStackFrame.result.compensation.carriedComp.aggregatedRAMEnergyConsumption} µs \n`
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
