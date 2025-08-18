import { CPUModel } from './CPUProfile/CPUModel'
import { CPUNode } from './CPUProfile/CPUNode'
import { LoggerHelper } from './LoggerHelper'
import { ExternalResourceHelper } from './ExternalResourceHelper'
import { ResolveFunctionIdentifierHelper } from './ResolveFunctionIdentifierHelper'
import { TypescriptHelper } from './TypescriptParser/TypescriptHelper'

import { ProjectReport } from '../model/ProjectReport'
import { ModuleReport } from '../model/ModuleReport'
import { UnifiedPath } from '../system/UnifiedPath'
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { MetricsDataCollection } from '../model/interfaces/MetricsDataCollection'
import {
	SourceNodeMetaData
} from '../model/SourceNodeMetaData'
import { GlobalIdentifier } from '../system/GlobalIdentifier'
import { NodeModule, WASM_NODE_MODULE } from '../model/NodeModule'
// Types
import {
	SourceNodeID_number,
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
} from '../types'

type AccountedTracker = {
	map: Map<string, string[]>,
	internMap: Map<string, boolean>,
	externMap: Map<string, boolean>,
	langInternalMap: Map<string, boolean>,
}

type CallIdentifier = {
	reportID: number,
	sourceNodeID: SourceNodeID_number
}

type LastNodeCallInfo = {
	report: ProjectReport | ModuleReport,
	sourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
}

type AwaiterStack = {
	awaiter: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>, // the last called __awaiter function
	awaiterParent: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined // the last async function that called the __awaiter function
}[]

export class InsertCPUProfileHelper {
	static callIdentifierToString(identifier: CallIdentifier) {
		return `${identifier.reportID}:${identifier.sourceNodeID}`
	}

	static initAccountedIfNecessary(
		accounted: AccountedTracker,
		callIdentifierString: string,
		kind: 'intern' | 'extern' | 'langInternal'
	) {
		if (!accounted.map.has(callIdentifierString)) {
			accounted.map.set(callIdentifierString, [])
			switch (kind) {
				case 'intern':
					accounted.internMap.set(callIdentifierString, true)
					break
				case 'extern':
					accounted.externMap.set(callIdentifierString, true)
					break
				case 'langInternal':
					accounted.langInternalMap.set(callIdentifierString, true)
					break
			}
			return true
		}
		return false
	}

	static removeFromAccounted(
		accounted: AccountedTracker,
		callIdentifier: CallIdentifier
	) {
		const callIdentifierString = InsertCPUProfileHelper.callIdentifierToString(callIdentifier)

		accounted.internMap.delete(callIdentifierString)
		accounted.externMap.delete(callIdentifierString)
		accounted.langInternalMap.delete(callIdentifierString)
		accounted.map.delete(callIdentifierString)
	}

	static markAsAccounted(
		accounted: AccountedTracker,
		self: CallIdentifier,
		parent: CallIdentifier
	): boolean {
		const selfCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(self)
		const parentCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(parent)
		let previousChildCalls = accounted.map.get(parentCallIdentifierString)
		let alreadyAccounted = false
		if (previousChildCalls === undefined) {
			previousChildCalls = []
			accounted.map.set(parentCallIdentifierString, previousChildCalls)
		} else {
			alreadyAccounted = previousChildCalls.includes(selfCallIdentifierString)
		}
		previousChildCalls.push(selfCallIdentifierString)
		return alreadyAccounted
	}

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
		reportToCredit: ProjectReport | ModuleReport,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		accounted: AccountedTracker
	) {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		const sourceNodeIdentifier = cpuNode.sourceLocation.sourceNodeIdentifier as
			LangInternalSourceNodeIdentifier_string
		const langInternalPath = cpuNode.sourceLocation.rawUrl as LangInternalPath_string

		const sourceNode = reportToCredit.addToLangInternal(
			langInternalPath,
			sourceNodeIdentifier,
		)
		const currentCallIdentifier = {
			reportID: reportToCredit.internID,
			sourceNodeID: sourceNode.id
		}
		const currentCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(currentCallIdentifier)
		sourceNode.sensorValues.profilerHits += cpuNode.profilerHits

		if (accounted.internMap.size === 0 && accounted.externMap.size === 0) {
			// if no extern or intern calls were accounted yet, add the time to the total of headless cpu time

			// IMPORTANT to change when new measurement type gets added

			reportToCredit.lang_internalHeadlessSensorValues.selfCPUTime =
				reportToCredit.lang_internalHeadlessSensorValues.selfCPUTime +
				(cpuTime.selfCPUTime || 0) as MicroSeconds_number

			reportToCredit.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption =
				reportToCredit.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption +
				(cpuEnergyConsumption.selfCPUEnergyConsumption || 0) as MilliJoule_number

			reportToCredit.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption =
				reportToCredit.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption +
				(ramEnergyConsumption.selfRAMEnergyConsumption || 0) as MilliJoule_number
		}
		sourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				accounted.map.has(currentCallIdentifierString)
			)
		)

		if (InsertCPUProfileHelper.initAccountedIfNecessary(
			accounted,
			currentCallIdentifierString,
			'langInternal')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (lastNodeCallInfo) {
			parentSourceNode_CallIdentifier = {
				reportID: lastNodeCallInfo.report.internID,
				sourceNodeID: lastNodeCallInfo.sourceNode.id
			}
			const alreadyAccounted = InsertCPUProfileHelper.markAsAccounted(
				accounted,
				{
					reportID: reportToCredit.internID,
					sourceNodeID: sourceNode.id
				},
				parentSourceNode_CallIdentifier
			)
			const langInternalSourceNodeReference = lastNodeCallInfo.sourceNode.addSensorValuesToLangInternal(
				sourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyAccounted
				)
			)
			langInternalSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier
		}
	}

	static async accountOwnCodeGetsExecutedByExternal(
		cpuNode: CPUNode,
		originalReport: ProjectReport,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		accounted: AccountedTracker
	) {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		const newLastInternSourceNode = originalReport.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
		)
		const currentCallIdentifier = {
			reportID: originalReport.internID,
			sourceNodeID: newLastInternSourceNode.id
		}
		const currentCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(
			currentCallIdentifier)
		newLastInternSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		// add measurements to original source code
		newLastInternSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				accounted.map.has(currentCallIdentifierString)
			)
		)

		if (InsertCPUProfileHelper.initAccountedIfNecessary(
			accounted,
			currentCallIdentifierString,
			'intern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		// if lastNodeCallInfo === undefined
		// the last call was from a lang internal source node (but within a node module report)
		// this is often a node:vm call within a node module to execute some script of the users code
		if (lastNodeCallInfo !== undefined) {
			// remove aggregated time from last intern source node
			parentSourceNode_CallIdentifier = {
				reportID: lastNodeCallInfo.report.internID,
				sourceNodeID: lastNodeCallInfo.sourceNode.id
			}
			// parent caller was already accounted once, so don't subtract the cpu time from it again
			const sensorValuesCorrected = InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				accounted.map.has(InsertCPUProfileHelper.callIdentifierToString(parentSourceNode_CallIdentifier)) &&
				accounted.map.get(InsertCPUProfileHelper.callIdentifierToString(
					parentSourceNode_CallIdentifier))!.length > 0
			)

			// IMPORTANT to change when new measurement type gets added
			lastNodeCallInfo.sourceNode.sensorValues.aggregatedCPUTime =
				lastNodeCallInfo.sourceNode.sensorValues.aggregatedCPUTime -
				(sensorValuesCorrected.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
			lastNodeCallInfo.sourceNode.sensorValues.aggregatedCPUEnergyConsumption =
				lastNodeCallInfo.sourceNode.sensorValues.aggregatedCPUEnergyConsumption -
				(sensorValuesCorrected.
					cpuEnergyConsumption.
					aggregatedCPUEnergyConsumption
					|| 0) as MilliJoule_number
			lastNodeCallInfo.sourceNode.sensorValues.aggregatedRAMEnergyConsumption =
				lastNodeCallInfo.sourceNode.sensorValues.aggregatedRAMEnergyConsumption -
				(sensorValuesCorrected.
					ramEnergyConsumption.
					aggregatedRAMEnergyConsumption
					|| 0) as MilliJoule_number

			// set call as accounted
			InsertCPUProfileHelper.markAsAccounted(
				accounted,
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
		}

		

		return {
			newReportToCredit: originalReport,
			newLastInternSourceNode,
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier
		}
	}

	static async accountToIntern(
		reportToCredit: ProjectReport | ModuleReport,
		cpuNode: CPUNode,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		awaiterStack: AwaiterStack,
		accounted: AccountedTracker
	) {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let isAwaiterSourceNode = false
		let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
		let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined

		// intern
		const newLastInternSourceNode = reportToCredit.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = {
			reportID: reportToCredit.internID,
			sourceNodeID: newLastInternSourceNode.id
		}
		const currentCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(
			currentCallIdentifier)
		newLastInternSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		newLastInternSourceNode.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				accounted.map.has(currentCallIdentifierString))
		)

		if (InsertCPUProfileHelper.initAccountedIfNecessary(
			accounted,
			currentCallIdentifierString,
			'intern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (sourceNodeLocation.functionIdentifier === TypescriptHelper.awaiterSourceNodeIdentifier()) {
			isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the lastNodeCallInfo is undefined the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			awaiterStack.push({
				awaiter: newLastInternSourceNode,
				awaiterParent: lastNodeCallInfo?.sourceNode
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
				accounted.map.has(
					InsertCPUProfileHelper.callIdentifierToString({
						reportID: reportToCredit.internID,
						sourceNodeID: lastAwaiterNode.awaiter.id
					}))
				&& lastAwaiterNode.awaiterParent === newLastInternSourceNode
			) {
				// the async function resolved when the awaiter was called,
				// the last function call was the child function of the awaiter (fulfilled, rejected or step)
				// and the current source node is the async function that called the awaiter

				const awaiterInternChild = newLastInternSourceNode.intern.get(
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
					newLastInternSourceNode.sensorValues.internCPUTime =
						newLastInternSourceNode.sensorValues.internCPUTime -
						(cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
					
					newLastInternSourceNode.sensorValues.internCPUEnergyConsumption =
						newLastInternSourceNode.sensorValues.internCPUEnergyConsumption -
						(cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
					
					newLastInternSourceNode.sensorValues.internRAMEnergyConsumption =
						newLastInternSourceNode.sensorValues.internRAMEnergyConsumption -
						(ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
				}
			}
		}

		if (lastNodeCallInfo && lastNodeCallInfo.sourceNode !== newLastInternSourceNode) {
			parentSourceNode_CallIdentifier = {
				reportID: lastNodeCallInfo.report.internID,
				sourceNodeID: lastNodeCallInfo.sourceNode.id
			}
			const alreadyAccounted = InsertCPUProfileHelper.markAsAccounted(
				accounted,
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)

			const internSourceNodeReference = lastNodeCallInfo.sourceNode.addSensorValuesToIntern(
				newLastInternSourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyAccounted
				)
			)
			internSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			isAwaiterSourceNode,
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier,
			newLastInternSourceNode
		}
	}

	static async accountToExtern(
		reportToCredit: ProjectReport | ModuleReport,
		cpuNode: CPUNode,
		nodeModule: NodeModule,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		accounted: AccountedTracker
	) {
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
		const { report, sourceNodeMetaData } = reportToCredit.addToExtern(
			sourceNodeLocation.relativeFilePath,
			nodeModule,
			sourceNodeLocation.functionIdentifier
		)
		const newReportToCredit = report
		const newLastInternSourceNode = sourceNodeMetaData
		const currentCallIdentifier = {
			reportID: report.internID,
			sourceNodeID: sourceNodeMetaData.id
		}
		const currentCallIdentifierString = InsertCPUProfileHelper.callIdentifierToString(
			currentCallIdentifier)
		sourceNodeMetaData.sensorValues.profilerHits += cpuNode.profilerHits
		sourceNodeMetaData.addToSensorValues(
			InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				accounted.map.has(currentCallIdentifierString)
			)
		)

		if (InsertCPUProfileHelper.initAccountedIfNecessary(
			accounted,
			currentCallIdentifierString,
			'extern')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (lastNodeCallInfo) {
			parentSourceNode_CallIdentifier = {
				reportID: lastNodeCallInfo.report.internID,
				sourceNodeID: lastNodeCallInfo.sourceNode.id
			}
			const alreadyAccounted = InsertCPUProfileHelper.markAsAccounted(
				accounted,
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
			// add to this source node as well
			const externSourceNodeReference = lastNodeCallInfo.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyAccounted
				)
			)
			externSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			parentSourceNode_CallIdentifier,
			firstTimeVisitedSourceNode_CallIdentifier,
			newLastInternSourceNode,
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

		function afterTraverse(
			parentSourceNode_CallIdentifier: CallIdentifier | undefined,
			firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined,
			isAwaiterSourceNode: boolean,
			accounted: AccountedTracker
		) {
			// equivalent to leave node since after child traverse
			if (parentSourceNode_CallIdentifier) {
				const childCalls = accounted.map.get(InsertCPUProfileHelper.callIdentifierToString(
					parentSourceNode_CallIdentifier))
				if (childCalls === undefined) {
					throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: expected childCalls to be present')
				}
				childCalls.pop() // remove self from parent
			}
			if (firstTimeVisitedSourceNode_CallIdentifier !== undefined) {
				InsertCPUProfileHelper.removeFromAccounted(accounted, firstTimeVisitedSourceNode_CallIdentifier)
			}
			if (isAwaiterSourceNode) {
				awaiterStack.pop()
			}
		}

		async function beforeTraverse(
			cpuNode: CPUNode,
			originalReport: ProjectReport,
			reportToCredit: ProjectReport | ModuleReport,
			lastNodeCallInfo: LastNodeCallInfo | undefined,
			accounted: AccountedTracker
		) {
			let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let isAwaiterSourceNode = false
			let newLastInternSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined = undefined
			let newReportToCredit: ProjectReport | ModuleReport | undefined = reportToCredit
			if (cpuNode.sourceLocation.isLangInternal) {
				const result = await InsertCPUProfileHelper.accountToLangInternal(
					cpuNode,
					reportToCredit,
					lastNodeCallInfo,
					accounted
				)
				firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
				parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
			} else if (cpuNode.sourceLocation.isWASM) {
				const wasmPath = new UnifiedPath(cpuNode.sourceLocation.rawUrl.substring(7)) // remove the 'wasm://' prefix

				if (
					reportToCredit instanceof ModuleReport &&
					reportToCredit.nodeModule === WASM_NODE_MODULE
				) {
					// is part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToIntern(
						reportToCredit,
						cpuNode,
						{
							relativeFilePath: wasmPath,
							functionIdentifier: 
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						lastNodeCallInfo,
						awaiterStack,
						accounted
					)
					isAwaiterSourceNode = result.isAwaiterSourceNode
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
					newLastInternSourceNode = result.newLastInternSourceNode
				} else {
					// is not part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToExtern(
						reportToCredit,
						cpuNode,
						WASM_NODE_MODULE,
						{
							relativeFilePath: wasmPath,
							functionIdentifier:
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						lastNodeCallInfo,
						accounted
					)

					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					newLastInternSourceNode = result.newLastInternSourceNode
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
						(
							lastNodeCallInfo !== undefined &&
							lastNodeCallInfo.sourceNode.sourceNodeIndex.pathIndex.moduleIndex.identifier !== '{self}'
						) // last internal node call originates from a node module
						||
						(
							lastNodeCallInfo === undefined &&
							reportToCredit !== originalReport
						) // the last call originates from the node engine (like node:vm), but the last recorded report was from a node module
					)

				if (ownCodeGetsExecutedByExternal) {
					const result = await InsertCPUProfileHelper.accountOwnCodeGetsExecutedByExternal(
						cpuNode,
						originalReport,
						sourceNodeLocation,
						lastNodeCallInfo,
						accounted
					)
					newReportToCredit = result.newReportToCredit
					newLastInternSourceNode = result.newLastInternSourceNode
					firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
					parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
				} else {
					// add to intern if the source file is not part of a node module
					// or the reportToCredit is the node module that source file belongs to
					if (
						!((relativeNodeModulePath && nodeModule)) || (
							reportToCredit instanceof ModuleReport
							&& reportToCredit.nodeModule.identifier === nodeModule.identifier
						)
					) {
						// currently in a node module scope, so add it to the node module report as an intern node
						newReportToCredit = nodeModule !== null ? reportToCredit : originalReport
						// add to intern
						const result = await InsertCPUProfileHelper.accountToIntern(
							newReportToCredit,
							cpuNode,
							sourceNodeLocation,
							lastNodeCallInfo,
							awaiterStack,
							accounted
						)
						isAwaiterSourceNode = result.isAwaiterSourceNode
						firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
						parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
						newLastInternSourceNode = result.newLastInternSourceNode
					} else {
						const result = await InsertCPUProfileHelper.accountToExtern(
							reportToCredit,
							cpuNode,
							nodeModule,
							sourceNodeLocation,
							lastNodeCallInfo,
							accounted
						)

						parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
						firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
						newLastInternSourceNode = result.newLastInternSourceNode
						newReportToCredit = result.newReportToCredit
					}
				}

				newLastInternSourceNode.presentInOriginalSourceCode = functionIdentifierPresentInOriginalFile
			}

			return {
				originalReport,
				reportToCredit,
				newReportToCredit,
				newLastInternSourceNode,
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode,
				accounted
			}
		}

		async function traverse(
			originalReport: ProjectReport,
			reportToCredit: ProjectReport | ModuleReport,
			cpuNode: CPUNode,
			lastNodeCallInfo: LastNodeCallInfo | undefined,
			accounted: AccountedTracker
		) {
			const {
				newReportToCredit,
				newLastInternSourceNode,
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode,
			} = await beforeTraverse(
				cpuNode,
				originalReport,
				reportToCredit,
				lastNodeCallInfo,
				accounted
			)
			for (const child of cpuNode.children()) {
				await traverse(
					originalReport,
					newReportToCredit,
					child,
					newLastInternSourceNode !== undefined ? {
						report: newReportToCredit,
						sourceNode: newLastInternSourceNode
					} : undefined,
					accounted
				)
			}
			afterTraverse(
				parentSourceNode_CallIdentifier,
				firstTimeVisitedSourceNode_CallIdentifier,
				isAwaiterSourceNode,
				accounted
			)
		}

		const accounted: AccountedTracker = {
			map: new Map<string, string[]>,
			internMap: new Map<string, boolean>(),
			externMap: new Map<string, boolean>(),
			langInternalMap: new Map<string, boolean>()
		}

		await traverse(
			reportToApply,
			reportToApply,
			cpuModel.getNode(0),
			undefined,
			accounted
		)

		if (accounted.map.size !== 0 ||
			accounted.internMap.size !== 0 ||
			accounted.externMap.size !== 0 ||
			accounted.langInternalMap.size !== 0) {
			LoggerHelper.error('InsertCPUProfileHelper.insertCPUProfile: accounted tracker should be empty after traverse', {
				mapSize: accounted.map.size,
				internMapSize: accounted.internMap.size,
				externMapSize: accounted.externMap.size,
				langInternalMapSize: accounted.langInternalMap.size
			}
			)
			throw new Error('InsertCPUProfileHelper.insertCPUProfile: accounted tracker should be empty after traverse')
		}
	}
}