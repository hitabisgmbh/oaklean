import { CallIdentifier } from './CallIdentifier'
import { CallRelationTracker } from './CallRelationTracker'

import { CPUModel } from '../CPUProfile/CPUModel'
import { CPUNode } from '../CPUProfile/CPUNode'
import { TypeScriptHelper } from '../TypescriptHelper'
import { LoggerHelper } from '../LoggerHelper'
import { ExternalResourceHelper } from '../ExternalResourceHelper'
import { ResolveFunctionIdentifierHelper } from '../ResolveFunctionIdentifierHelper'
import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import { UnifiedPath } from '../../system/UnifiedPath'
import { ICpuProfileRaw } from '../../../lib/vscode-js-profile-core/src/cpu/types'
import { MetricsDataCollection } from '../../model/interfaces/MetricsDataCollection'
import {
	SourceNodeMetaData
} from '../../model/SourceNodeMetaData'
import { GlobalIdentifier } from '../../system/GlobalIdentifier'
import { NodeModule, WASM_NODE_MODULE } from '../../model/NodeModule'
// Types
import {
	SourceNodeMetaDataType,
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	SourceNodeIdentifier_string,
	NanoSeconds_BigInt,
	MilliJoule_number,
	IPureCPUTime,
	IPureCPUEnergyConsumption,
	IPureRAMEnergyConsumption,
	MicroSeconds_number,
	ResolvedSourceNodeLocation
} from '../../types'

type SourceNodeInfo = {
	report: ProjectReport | ModuleReport,
	sourceNode: SourceNodeMetaData<
	SourceNodeMetaDataType.SourceNode |
	SourceNodeMetaDataType.LangInternalSourceNode
	> | null
}

type AwaiterStack = {
	awaiter: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>, // the last called __awaiter function
	awaiterParent: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined // the last async function that called the __awaiter function
}[]

export class InsertCPUProfileHelper {
	// IMPORTANT to change when new measurement type gets added
	static sensorValuesForVisitedNode(
		cpuTime: IPureCPUTime,
		cpuEnergyConsumption: IPureCPUEnergyConsumption,
		ramEnergyConsumption: IPureRAMEnergyConsumption,
		visited: boolean,
	): {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption
		} {
		const cpuTimeResult: IPureCPUTime = {
			selfCPUTime: cpuTime.selfCPUTime,
			aggregatedCPUTime: cpuTime.aggregatedCPUTime
		}
		const cpuEnergyConsumptionResult: IPureCPUEnergyConsumption = {
			selfCPUEnergyConsumption: cpuEnergyConsumption.selfCPUEnergyConsumption,
			aggregatedCPUEnergyConsumption: cpuEnergyConsumption.aggregatedCPUEnergyConsumption
		}
		const ramEnergyConsumptionResult: IPureRAMEnergyConsumption = {
			selfRAMEnergyConsumption: ramEnergyConsumption.selfRAMEnergyConsumption,
			aggregatedRAMEnergyConsumption: ramEnergyConsumption.aggregatedRAMEnergyConsumption
		}
		if (visited) {
			// if the source node was already visited in the call tree
			// don't add the measurements to the aggregated values
			// since they were already included during the first visit of the source node
			cpuTimeResult.aggregatedCPUTime = 0 as MicroSeconds_number
			cpuEnergyConsumptionResult.aggregatedCPUEnergyConsumption = 0 as MilliJoule_number
			ramEnergyConsumptionResult.aggregatedRAMEnergyConsumption = 0 as MilliJoule_number
		}
		return {
			cpuTime: cpuTimeResult,
			cpuEnergyConsumption: cpuEnergyConsumptionResult,
			ramEnergyConsumption: ramEnergyConsumptionResult
		}
	}

	static async accountToLangInternal(
		cpuNode: CPUNode,
		parentNodeInfo: SourceNodeInfo,
		callRelationTracker: CallRelationTracker
	): Promise<{
			accountedSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNode>,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			parentSourceNode_CallIdentifier: CallIdentifier | undefined
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		const sourceNodeIdentifier = cpuNode.sourceLocation.sourceNodeIdentifier as
			LangInternalSourceNodeIdentifier_string
		const langInternalPath = cpuNode.sourceLocation.rawUrl as LangInternalPath_string

		const accountedSourceNode = parentNodeInfo.report.addToLangInternal(
			langInternalPath,
			sourceNodeIdentifier,
		)
		const currentCallIdentifier = new CallIdentifier(
			parentNodeInfo.report.internID,
			accountedSourceNode.id
		)
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits

		if (callRelationTracker.currentlyInHeadlessScope()) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
			// IMPORTANT to change when new measurement type gets added

			parentNodeInfo.report.lang_internalHeadlessSensorValues.selfCPUTime =
				parentNodeInfo.report.lang_internalHeadlessSensorValues.selfCPUTime +
				(cpuTime.selfCPUTime || 0) as MicroSeconds_number

			parentNodeInfo.report.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption =
				parentNodeInfo.report.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption +
				(cpuEnergyConsumption.selfCPUEnergyConsumption || 0) as MilliJoule_number

			parentNodeInfo.report.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption =
				parentNodeInfo.report.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption +
				(ramEnergyConsumption.selfRAMEnergyConsumption || 0) as MilliJoule_number
		}
		accountedSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		if (callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (
			// ensure its a source node of type internal
			parentNodeInfo.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			parentSourceNode_CallIdentifier = new CallIdentifier(
				parentNodeInfo.report.internID,
				parentNodeInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
			const langInternalSourceNodeReference = parentNodeInfo.sourceNode.addSensorValuesToLangInternal(
				accountedSourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			langInternalSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			accountedSourceNode,
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier
		}
	}

	static async accountOwnCodeGetsExecutedByExternal(
		cpuNode: CPUNode,
		originalReport: ProjectReport,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		parentNodeInfo: SourceNodeInfo,
		callRelationTracker: CallRelationTracker
	): Promise<{
			newReportToCredit: ProjectReport,
			accountedSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			parentSourceNode_CallIdentifier: CallIdentifier | undefined
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		const accountedSourceNode = originalReport.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
		)
		const currentCallIdentifier = new CallIdentifier(
			originalReport.internID,
			accountedSourceNode.id
		)

		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		// add measurements to original source code
		accountedSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		if (callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		// if parentNodeInfo.sourceNode.type !== SourceNodeMetaDataType.SourceNode
		// the last call was from a lang internal source node (but within a node module report)
		// this is often a node:vm call within a node module to execute some script of the users code
		if (
			// ensure its a source node of type internal
			parentNodeInfo.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			// remove aggregated time from last intern source node
			parentSourceNode_CallIdentifier = new CallIdentifier(
				parentNodeInfo.report.internID,
				parentNodeInfo.sourceNode.id
			)
			// if the parent caller was already recorded once, don't subtract the cpu time from it again
			const sensorValuesCorrected = InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.hasChildrenRecorded(parentSourceNode_CallIdentifier)
			)

			// IMPORTANT to change when new measurement type gets added
			parentNodeInfo.sourceNode.sensorValues.aggregatedCPUTime =
				parentNodeInfo.sourceNode.sensorValues.aggregatedCPUTime -
				(sensorValuesCorrected.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
			parentNodeInfo.sourceNode.sensorValues.aggregatedCPUEnergyConsumption =
				parentNodeInfo.sourceNode.sensorValues.aggregatedCPUEnergyConsumption -
				(sensorValuesCorrected.
					cpuEnergyConsumption.
					aggregatedCPUEnergyConsumption
					|| 0) as MilliJoule_number
			parentNodeInfo.sourceNode.sensorValues.aggregatedRAMEnergyConsumption =
				parentNodeInfo.sourceNode.sensorValues.aggregatedRAMEnergyConsumption -
				(sensorValuesCorrected.
					ramEnergyConsumption.
					aggregatedRAMEnergyConsumption
					|| 0) as MilliJoule_number

			// link call to the parent caller
			callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
		}

		

		return {
			newReportToCredit: originalReport,
			accountedSourceNode,
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier
		}
	}

	static async accountToIntern(
		cpuNode: CPUNode,
		parentNodeInfo: SourceNodeInfo,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		awaiterStack: AwaiterStack,
		callRelationTracker: CallRelationTracker
	): Promise<{
			isAwaiterSourceNode: boolean,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			parentSourceNode_CallIdentifier: CallIdentifier | undefined,
			accountedSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let isAwaiterSourceNode = false
		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		// intern
		const accountedSourceNode = parentNodeInfo.report.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = new CallIdentifier(
			parentNodeInfo.report.internID,
			accountedSourceNode.id
		)
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		accountedSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		if (callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (sourceNodeLocation.functionIdentifier === TypeScriptHelper.awaiterSourceNodeIdentifier()) {
			isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the parentNodeInfo.sourceNode is null or of type lang internal
			// the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			awaiterStack.push({
				awaiter: accountedSourceNode,
				awaiterParent: parentNodeInfo.sourceNode?.type === SourceNodeMetaDataType.SourceNode ?
					(parentNodeInfo.sourceNode as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>) :
					undefined
			})
		}

		if (
			!isAwaiterSourceNode &&
			awaiterStack.length > 0
		) {
			/*
				The current source node is not an awaiter
				but there is an awaiter in the source file and the current source node was called by it.
				If the current source node was already using the awaiter (as an intern call) in the call tree,
				subtract the current aggregated measurements, since they are already accounted
			*/
			const lastAwaiterNode = awaiterStack[awaiterStack.length - 1]
			if (lastAwaiterNode === undefined) {
				throw new Error('InsertCPUProfileHelper.accountToIntern: expected an awaiter in awaiterStack')
			}
			if (
				callRelationTracker.isCallRecorded(
					new CallIdentifier(
						parentNodeInfo.report.internID,
						lastAwaiterNode.awaiter.id
					)) && lastAwaiterNode.awaiterParent === accountedSourceNode
			) {
				// the async function resolved when the awaiter was called,
				// the last function call was the child function of the awaiter (fulfilled, rejected or step)
				// and the current source node is the async function that called the awaiter

				const awaiterInternChild = accountedSourceNode.intern.get(
					lastAwaiterNode.awaiter.id
				)
				if (awaiterInternChild !== undefined) {
					// IMPORTANT to change when new measurement type gets added
					awaiterInternChild.
						sensorValues.
						aggregatedCPUTime = awaiterInternChild.sensorValues.aggregatedCPUTime -
							(cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
					awaiterInternChild.
						sensorValues.
						aggregatedCPUEnergyConsumption = awaiterInternChild.
							sensorValues.
							aggregatedCPUEnergyConsumption -
							(cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
					awaiterInternChild.
						sensorValues.
						aggregatedRAMEnergyConsumption = awaiterInternChild.
							sensorValues.
							aggregatedRAMEnergyConsumption -
					(ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number

					// IMPORTANT to change when new measurement type gets added
					accountedSourceNode.sensorValues.internCPUTime =
						accountedSourceNode.sensorValues.internCPUTime -
						(cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
					
					accountedSourceNode.sensorValues.internCPUEnergyConsumption =
						accountedSourceNode.sensorValues.internCPUEnergyConsumption -
						(cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
					
					accountedSourceNode.sensorValues.internRAMEnergyConsumption =
						accountedSourceNode.sensorValues.internRAMEnergyConsumption -
						(ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
				}
			}
		}

		if (
			// ensure its a source node of type internal
			parentNodeInfo.sourceNode?.type === SourceNodeMetaDataType.SourceNode &&
			parentNodeInfo.sourceNode !== accountedSourceNode
		) {
			parentSourceNode_CallIdentifier = new CallIdentifier(
				parentNodeInfo.report.internID,
				parentNodeInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)

			const internSourceNodeReference = parentNodeInfo.sourceNode.addSensorValuesToIntern(
				accountedSourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			internSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			isAwaiterSourceNode,
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier,
			accountedSourceNode
		}
	}

	static async accountToExtern(
		cpuNode: CPUNode,
		parentNodeInfo: SourceNodeInfo,
		nodeModule: NodeModule,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		callRelationTracker: CallRelationTracker
	): Promise<{
			parentSourceNode_CallIdentifier: CallIdentifier | undefined,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			accountedSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
			newReportToCredit: ModuleReport
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption
		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		const globalIdentifier = new GlobalIdentifier(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
			nodeModule
		)

		// extern
		const { report, sourceNodeMetaData } = parentNodeInfo.report.addToExtern(
			sourceNodeLocation.relativeFilePath,
			nodeModule,
			sourceNodeLocation.functionIdentifier
		)
		const newReportToCredit = report
		const accountedSourceNode = sourceNodeMetaData
		const currentCallIdentifier = new CallIdentifier(
			report.internID,
			accountedSourceNode.id
		)
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		accountedSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		if (callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'extern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (
			// ensure its a source node of type internal
			parentNodeInfo.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			parentSourceNode_CallIdentifier = new CallIdentifier(
				parentNodeInfo.report.internID,
				parentNodeInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
			// add to this source node as well
			const externSourceNodeReference = parentNodeInfo.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			externSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			parentSourceNode_CallIdentifier,
			firstTimeVisitedSourceNode_CallIdentifier,
			accountedSourceNode,
			newReportToCredit
		}
	}

	static async insertCPUProfile(
		reportToApply: ProjectReport,
		rootDir: UnifiedPath,
		profile: ICpuProfileRaw,
		externalResourceHelper: ExternalResourceHelper,
		metricsDataCollection?: MetricsDataCollection,
	) {
		if (reportToApply.executionDetails.highResolutionBeginTime === undefined) {
			throw new Error('InsertCPUProfileHelper.insertCPUProfile: executionDetails.highResolutionBeginTime is undefined')
		}
		const cpuModel = new CPUModel(
			rootDir,
			profile,
			BigInt(reportToApply.executionDetails.highResolutionBeginTime) as NanoSeconds_BigInt,
			externalResourceHelper
		)

		if (metricsDataCollection && metricsDataCollection.items.length > 0) {
			// fill the cpu model with energy values
			cpuModel.energyValuesPerNode = cpuModel.energyValuesPerNodeByMetricsData(metricsDataCollection)
		}
		const resolveFunctionIdentifierHelper = new ResolveFunctionIdentifierHelper(
			rootDir,
			externalResourceHelper
		)

		const awaiterStack: AwaiterStack = []

		const originalReport = reportToApply

		function afterTraverse(
			parentSourceNode_CallIdentifier: CallIdentifier | undefined,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			isAwaiterSourceNode: boolean,
			callRelationTracker: CallRelationTracker
		) {
			// equivalent to leave node since after child traverse
			if (parentSourceNode_CallIdentifier) {
				if (!callRelationTracker.removeLastChildRecord(parentSourceNode_CallIdentifier)) {
					throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: expected childCalls to be present')
				}
			}
			if (firstTimeVisitedSourceNode_CallIdentifier !== undefined) {
				callRelationTracker.removeCallRecord(firstTimeVisitedSourceNode_CallIdentifier)
			}
			if (isAwaiterSourceNode) {
				awaiterStack.pop()
			}
		}

		async function beforeTraverse(
			cpuNode: CPUNode,
			parentNodeInfo: SourceNodeInfo,
			callRelationTracker: CallRelationTracker
		) {
			let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let isAwaiterSourceNode = false
			let lastAccountedSourceNode: SourceNodeMetaData<
			SourceNodeMetaDataType.SourceNode |
			SourceNodeMetaDataType.LangInternalSourceNode
			> | null = null
			let newReportToCredit: ProjectReport | ModuleReport | undefined = parentNodeInfo.report
			
			if (cpuNode.sourceLocation.isLangInternal) {
				const result = await InsertCPUProfileHelper.accountToLangInternal(
					cpuNode,
					parentNodeInfo,
					callRelationTracker
				)
				firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
				parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
				lastAccountedSourceNode = result.accountedSourceNode
			} else if (cpuNode.sourceLocation.isWASM) {
				const wasmPath = new UnifiedPath(cpuNode.sourceLocation.rawUrl.substring(7)) // remove the 'wasm://' prefix

				if (
					parentNodeInfo.report instanceof ModuleReport &&
					parentNodeInfo.report.nodeModule === WASM_NODE_MODULE
				) {
					// is part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToIntern(
						cpuNode,
						parentNodeInfo,
						{
							relativeFilePath: wasmPath,
							functionIdentifier: 
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						awaiterStack,
						callRelationTracker
					)
					isAwaiterSourceNode = result.isAwaiterSourceNode
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
					lastAccountedSourceNode = result.accountedSourceNode
				} else {
					// is not part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToExtern(
						cpuNode,
						parentNodeInfo,
						WASM_NODE_MODULE,
						{
							relativeFilePath: wasmPath,
							functionIdentifier:
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						callRelationTracker
					)

					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					lastAccountedSourceNode = result.accountedSourceNode
					newReportToCredit = result.newReportToCredit
				}
			} else if (!cpuNode.sourceLocation.isEmpty) {
				const {
					sourceNodeLocation,
					functionIdentifierPresentInOriginalFile,
					nodeModule,
					relativeNodeModulePath
				} = await resolveFunctionIdentifierHelper.resolveFunctionIdentifier(
					cpuNode.sourceLocation
				)

				// this happens for node modules like the jest-runner, that executes the own code
				// the measurements will be credited to the original code rather than the node module that executes it
				const ownCodeGetsExecutedByExternal =
					relativeNodeModulePath === null && // the currently executed file is not part of a node module
					(
						// last internal node call originates from a node module
						parentNodeInfo.sourceNode?.sourceNodeIndex.pathIndex.moduleIndex.identifier !== '{self}' ||
						// the last call originates from the node engine (like node:vm)
						// but the last recorded report was from a node module
						parentNodeInfo.report !== originalReport
					)

				if (ownCodeGetsExecutedByExternal) {
					const result = await InsertCPUProfileHelper.accountOwnCodeGetsExecutedByExternal(
						cpuNode,
						originalReport,
						sourceNodeLocation,
						parentNodeInfo,
						callRelationTracker
					)
					newReportToCredit = result.newReportToCredit
					lastAccountedSourceNode = result.accountedSourceNode
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
				} else {
					// add to intern if the source file is not part of a node module
					// or the reportToCredit is the node module that source file belongs to
					if (
						!((relativeNodeModulePath && nodeModule)) || (
							parentNodeInfo.report instanceof ModuleReport
							&& parentNodeInfo.report.nodeModule.identifier === nodeModule.identifier
						)
					) {
						// add to intern
						const result = await InsertCPUProfileHelper.accountToIntern(
							cpuNode,
							parentNodeInfo,
							sourceNodeLocation,
							awaiterStack,
							callRelationTracker
						)
						isAwaiterSourceNode = result.isAwaiterSourceNode
						firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
						parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
						lastAccountedSourceNode = result.accountedSourceNode
					} else {
						// add to extern
						const result = await InsertCPUProfileHelper.accountToExtern(
							cpuNode,
							parentNodeInfo,
							nodeModule,
							sourceNodeLocation,
							callRelationTracker
						)

						parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
						firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
						lastAccountedSourceNode = result.accountedSourceNode
						newReportToCredit = result.newReportToCredit
					}
				}

				lastAccountedSourceNode.presentInOriginalSourceCode = functionIdentifierPresentInOriginalFile
			}

			return {
				newLastNodeCallInfo: {
					report: newReportToCredit,
					sourceNode: lastAccountedSourceNode
				} satisfies SourceNodeInfo,
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode
			}
		}

		async function traverse(
			lastNodeCallInfo: SourceNodeInfo,
			cpuNode: CPUNode,
			callRelationTracker: CallRelationTracker
		) {
			const {
				newLastNodeCallInfo,
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode,
			} = await beforeTraverse(
				cpuNode,
				lastNodeCallInfo,
				callRelationTracker
			)

			for (const child of cpuNode.children()) {
				await traverse(
					newLastNodeCallInfo,
					child,
					callRelationTracker
				)
			}
			afterTraverse(
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode,
				callRelationTracker
			)
		}

		const callRelationTracker = new CallRelationTracker()

		await traverse(
			{
				report: reportToApply,
				sourceNode: null
			},
			cpuModel.getNode(0),
			callRelationTracker
		)

		if (!callRelationTracker.isEmpty()) {
			LoggerHelper.error(
				'InsertCPUProfileHelper.insertCPUProfile: call relation tracker should be empty after traverse',
				callRelationTracker.debugInfo()
			)
			throw new Error('InsertCPUProfileHelper.insertCPUProfile: call relation tracker should be empty after traverse')
		}
	}
}