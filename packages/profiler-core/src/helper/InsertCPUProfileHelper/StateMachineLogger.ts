import { State } from './types/state'
import { Transition } from './types/transition'
import { AccountingInfo, Compensation } from './types/accounting'

import { LoggerHelper } from '../LoggerHelper'
import { CPUNode } from '../CPUProfile/CPUNode'
import { SourceNodeMetaData } from '../../model'
import { SourceNodeMetaDataType_Reference } from '../../types'

export class StateMachineLogger {
	static formatReference = LoggerHelper.treeStyleKeyValues(['CPU Time', 'CPU Energy', 'RAM Energy'] as const, 29)

	static formatState = LoggerHelper.treeStyleKeyValues(
		[
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
		] as const,
		29
	)

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
			throw new Error('InsertCPUProfileStateMachine.logState: sourceNode has no index')
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
					'CPU Time': `self=${sensorValues.selfCPUTime} µs | total=${sensorValues.aggregatedCPUTime} µs | l=${sensorValues.langInternalCPUTime} µs | i=${sensorValues.internCPUTime} µs | e=${sensorValues.externCPUTime} µs`,
					'CPU Energy': `self=${sensorValues.selfCPUEnergyConsumption} mJ | total=${sensorValues.aggregatedCPUEnergyConsumption} mJ | l=${sensorValues.langInternalCPUEnergyConsumption} mJ | i=${sensorValues.internCPUEnergyConsumption} mJ | e=${sensorValues.externCPUEnergyConsumption} mJ `,
					'RAM Energy': `self=${sensorValues.selfRAMEnergyConsumption} mJ | total=${sensorValues.aggregatedRAMEnergyConsumption} mJ | l=${sensorValues.langInternalRAMEnergyConsumption} mJ | i=${sensorValues.internRAMEnergyConsumption} mJ | e=${sensorValues.externRAMEnergyConsumption} mJ`
				})
		)
		const iterators = {
			LANG_INTERNAL: currentState.callIdentifier.sourceNode.lang_internal.values(),
			INTERN: currentState.callIdentifier.sourceNode.intern.values(),
			EXTERN: currentState.callIdentifier.sourceNode.extern.values()
		}
		for (const [type, iterator] of Object.entries(iterators)) {
			let hasEntries = false
			for (const referenceSourceNode of iterator) {
				if (hasEntries === false) {
					LoggerHelper.log(LoggerHelper.warnString(`${type} REFERENCES`))
					hasEntries = true
				}
				StateMachineLogger.logSourceNodeReference(referenceSourceNode)
			}
		}
	}

	static logSourceNodeReference(referenceSourceNode: SourceNodeMetaData<SourceNodeMetaDataType_Reference>) {
		LoggerHelper.log(
			`SourceNodeID: ${referenceSourceNode.id.toString()}\n` +
				StateMachineLogger.formatReference({
					'CPU Time': `self=${referenceSourceNode.sensorValues.selfCPUTime} µs | total=${referenceSourceNode.sensorValues.aggregatedCPUTime} µs`,
					'CPU Energy': `self=${referenceSourceNode.sensorValues.selfCPUEnergyConsumption} mJ | total=${referenceSourceNode.sensorValues.aggregatedCPUEnergyConsumption} mJ`,
					'RAM Energy': `self=${referenceSourceNode.sensorValues.selfRAMEnergyConsumption} mJ | total=${referenceSourceNode.sensorValues.aggregatedRAMEnergyConsumption} mJ`
				})
		)
	}

	static logLeaveTransition(currentState: State, nextState: State) {
		const currentSourceNodeIndex = currentState.callIdentifier.sourceNode?.getIndex()

		const currentSourceNodeName = currentSourceNodeIndex !== undefined ? currentSourceNodeIndex.functionName : '(root)'

		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName = nextSourceNodeIndex !== undefined ? nextSourceNodeIndex.functionName : '(root)'

		LoggerHelper.log(
			LoggerHelper.errorString('[LEAVE TRANSITION]'),
			`${currentSourceNodeName}`,
			`-> ${nextSourceNodeName}`
		)
	}

	static formatTransition = LoggerHelper.treeStyleKeyValues(
		[
			'CPU Node',
			'Transition',
			'Create Link',
			'AccountingType',
			'FirstTimeVisited',
			'Accounted Hits',
			'Accounted CPU Time',
			'Accounted CPU Energy',
			'Accounted RAM Energy'
		] as const,
		29
	)

	static logTransition(
		cpuNode: CPUNode,
		transition: Transition,
		accountingInfo: AccountingInfo,
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
		const currentSourceNodeName = currentSourceNodeIndex !== undefined ? currentSourceNodeIndex.functionName : '(root)'

		const nextSourceNodeIndex = nextState.callIdentifier.sourceNode?.getIndex()
		const nextSourceNodeName = nextSourceNodeIndex !== undefined ? nextSourceNodeIndex.functionName : '(root)'

		LoggerHelper.log(
			LoggerHelper.warnString('[TRANSITION]'),
			`${currentSourceNodeName} -> ${nextSourceNodeName}`,
			'\n' +
				StateMachineLogger.formatTransition({
					'CPU Node': String(cpuNode.index).padStart(3, '0'),
					Transition: transition.transition,
					'Create Link': transition.options.createLink.toString(),
					AccountingType: accountingInfo.type,
					FirstTimeVisited: accountingInfo.accountedSourceNode.firstTimeVisited.toString(),
					'Accounted Hits': `${cpuNode.profilerHits}`,
					'Accounted CPU Time': `self=${accountingInfo?.accountedSensorValues.selfCPUTime || 0} µs | total=${
						accountingInfo?.accountedSensorValues.aggregatedCPUTime || 0
					} µs`,
					'Accounted CPU Energy': `self=${
						accountingInfo?.accountedSensorValues.selfCPUEnergyConsumption || 0
					} mJ | total=${accountingInfo?.accountedSensorValues.aggregatedCPUEnergyConsumption || 0} mJ`,
					'Accounted RAM Energy': `self=${
						accountingInfo?.accountedSensorValues.selfRAMEnergyConsumption || 0
					} mJ | total=${accountingInfo?.accountedSensorValues.aggregatedRAMEnergyConsumption || 0} mJ`
				})
		)
	}

	static formatCompensation = LoggerHelper.treeStyleKeyValues(
		[
			'Compensation ID',
			'Depth',
			'CPU Node',
			'ReportID',
			'SourceNodeID',
			'Scope',
			'Type',
			'Headless',
			'Compensated CPU Time',
			'Compensated CPU Energy',
			'Compensated RAM Energy'
		] as const,
		29
	)

	static logCompensation(
		depth: number,
		cpuNode: CPUNode,
		currentState: State,
		compensation: Compensation,
		title: 'CREATE COMPENSATION' | 'APPLY COMPENSATION'
	) {
		/*
			[CREATE COMPENSATION | APPLY COMPENSATION] 2 moduleFunction_fileA_0 (./fileA.js)
			├─ Depth                  : 2
			├─ CPU Node               : 002
			├─ ReportID               : 1
			├─ SourceNodeID           : 5
			├─ Scope                  : module
			├─ Type                   : intern
			├─ Headless               : false
			├─ Compensated CPU Time   : self=30 µs | total=0 µs
			├─ Compensated CPU Energy : self=0 mJ | total=0 mJ
			├─ Compensated RAM Energy : self=0 mJ | total=0 mJ
		*/
		if (currentState.callIdentifier.sourceNode === null) {
			LoggerHelper.log(
				LoggerHelper.errorString(`[${title}]`),
				compensation.id.toString(),
				`(${cpuNode.sourceLocation.rawFunctionName})`,
				'~',
				'(root)'
			)
			return
		}

		const sourceNodeIndex = currentState.callIdentifier.sourceNode.getIndex()
		if (sourceNodeIndex === undefined) {
			throw new Error('InsertCPUProfileStateMachine.logCompensation: sourceNode has no index')
		}

		const createdComp = compensation.createdComp
		const carriedComp = compensation.carriedComp

		LoggerHelper.log(
			LoggerHelper.errorString(`[${title}]`),
			compensation.id.toString(),
			`(${cpuNode.sourceLocation.rawFunctionName})`,
			'~',
			`${sourceNodeIndex.functionName}`,
			`(${sourceNodeIndex.pathIndex.identifier})`,
			'\n' +
				StateMachineLogger.formatCompensation({
					'Compensation ID': compensation.id.toString(),
					Depth: depth.toString(),
					'CPU Node': String(cpuNode.index).padStart(3, '0'),
					ReportID: currentState.callIdentifier.report.internID.toString(),
					SourceNodeID: currentState.callIdentifier.sourceNode.id.toString(),
					Scope: currentState.scope,
					Type: currentState.type,
					Headless: currentState.headless.toString(),
					'Compensated CPU Time': `created=${createdComp?.aggregatedCPUTime} µs | carried=${carriedComp?.aggregatedCPUTime} µs`,
					'Compensated CPU Energy': `created=${createdComp?.aggregatedCPUEnergyConsumption} mJ | carried=${carriedComp?.aggregatedCPUEnergyConsumption} mJ`,
					'Compensated RAM Energy': `created=${createdComp?.aggregatedRAMEnergyConsumption} mJ | carried=${carriedComp?.aggregatedRAMEnergyConsumption} mJ`
				})
		)
	}
}
