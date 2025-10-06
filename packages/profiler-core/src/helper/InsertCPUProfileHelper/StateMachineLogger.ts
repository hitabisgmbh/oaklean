import { State } from './types/state'
import { Transition } from './types/transition'
import { AccountingInfo } from './types/accounting'

import { LoggerHelper } from '../LoggerHelper'
import { CPUNode } from '../CPUProfile/CPUNode'

export class StateMachineLogger {
	static formatState = LoggerHelper.treeStyleKeyValues([
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

	static logState(depth: number, cpuNode: CPUNode, currentState: State) {
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
			LoggerHelper.log(LoggerHelper.successString('[STATE]'), '(root)')
			return
		}

		const sourceNodeIndex = currentState.callIdentifier.sourceNode?.getIndex()
		if (sourceNodeIndex === undefined) {
			throw new Error(
				'InsertCPUProfileStateMachine.logState: sourceNode has no index'
			)
		}

		const sensorValues = currentState.callIdentifier.sourceNode.sensorValues

		LoggerHelper.log(
			LoggerHelper.successString('[STATE]'),
			`${sourceNodeIndex.functionName}`,
			`(${sourceNodeIndex.pathIndex.identifier})`,
			'\n' +
				StateMachineLogger.formatState({
					Depth: depth.toString(),
					'CPU Node': String(cpuNode.index).padStart(3, '0'),
					ReportID: currentState.callIdentifier.report.internID.toString(),
					SourceNodeID: currentState.callIdentifier.sourceNode.id.toString(),
					Scope: currentState.scope,
					Type: currentState.type,
					Headless: currentState.headless.toString(),
					'Profiler Hits': `${sensorValues.profilerHits}`,
					'CPU Time': `self=${sensorValues.selfCPUTime} µs | total=${sensorValues.aggregatedCPUTime} µs`,
					'CPU Energy': `self=${sensorValues.selfCPUEnergyConsumption} mJ | total=${sensorValues.aggregatedCPUEnergyConsumption} mJ`,
					'RAM Energy': `self=${sensorValues.selfRAMEnergyConsumption} mJ | total=${sensorValues.aggregatedRAMEnergyConsumption} mJ`
				})
		)
	}

	static logLeaveTransition(currentState: State, nextState: State) {
		const currentSourceNodeIndex =
			currentState.callIdentifier.sourceNode?.getIndex()

		const currentSourceNodeName =
			currentSourceNodeIndex !== undefined
				? currentSourceNodeIndex.functionName
				: '(root)'

		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName =
			nextSourceNodeIndex !== undefined
				? nextSourceNodeIndex.functionName
				: '(root)'

		LoggerHelper.log(
			LoggerHelper.errorString('[LEAVE TRANSITION]'),
			`${currentSourceNodeName}`,
			LoggerHelper.successString(
				`${
					currentState.callIdentifier.firstTimeVisited
						? '[last-occurrence-in-tree]'
						: ''
				}`
			),
			`-> ${nextSourceNodeName}`
		)
	}

	static formatTransition = LoggerHelper.treeStyleKeyValues([
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

	static logTransition(
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
		const currentSourceNodeIndex =
			currentState.callIdentifier.sourceNode?.getIndex()
		const currentSourceNodeName =
			currentSourceNodeIndex !== undefined
				? currentSourceNodeIndex.functionName
				: '(root)'

		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName =
			nextSourceNodeIndex !== undefined
				? nextSourceNodeIndex.functionName
				: '(root)'

		LoggerHelper.log(
			LoggerHelper.warnString('[TRANSITION]'),
			`${currentSourceNodeName} -> ${nextSourceNodeName}`,
			'\n' +
				StateMachineLogger.formatTransition({
					'CPU Node': String(cpuNode.index).padStart(3, '0'),
					Transition: transition.transition,
					'Create Link':
						transition.transition === 'stayInState'
							? 'false'
							: transition.options.createLink.toString(),
					AccountingType:
						accountingInfo === null ? 'styInState' : accountingInfo?.type,
					FirstTimeVisited:
						nextState.callIdentifier.firstTimeVisited.toString(),
					'Accounted Hits': `${accountingInfo?.accountedProfilerHits}`,
					'Accounted CPU Time': `self=${
						accountingInfo?.accountedSensorValues.selfCPUTime || 0
					} µs | total=${
						accountingInfo?.accountedSensorValues.aggregatedCPUTime || 0
					} µs`,
					'Accounted CPU Energy': `self=${
						accountingInfo?.accountedSensorValues.selfCPUEnergyConsumption || 0
					} mJ | total=${
						accountingInfo?.accountedSensorValues
							.aggregatedCPUEnergyConsumption || 0
					} mJ`,
					'Accounted RAM Energy': `self=${
						accountingInfo?.accountedSensorValues.selfRAMEnergyConsumption || 0
					} mJ | total=${
						accountingInfo?.accountedSensorValues
							.aggregatedRAMEnergyConsumption || 0
					} mJ`
				})
		)
	}
}
