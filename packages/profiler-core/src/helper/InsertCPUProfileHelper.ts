import * as fs from 'fs'
import path from 'path'

import { MappedPosition } from 'source-map'

import { CPUModel } from './CPUModel'
import { CPUNode } from './CPUNode'
import { TypescriptParser } from './TypescriptParser'
import { TypeScriptHelper } from './TypescriptHelper'
import { LoggerHelper } from './LoggerHelper'
import { InspectorHelper } from './InspectorHelper'

import { ProjectReport } from '../model/ProjectReport'
import { ModuleReport } from '../model/ModuleReport'
import { UnifiedPath } from '../system/UnifiedPath'
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { MetricsDataCollection } from '../model/interfaces/MetricsDataCollection'
import { ModelMap } from '../model/ModelMap'
import { ProgramStructureTree } from '../model/ProgramStructureTree'
import {
	SourceNodeMetaData
} from '../model/SourceNodeMetaData'
import { GlobalIdentifier } from '../system/GlobalIdentifier'
import { NodeModule } from '../model/NodeModule'
// Types
import {
	UnifiedPath_string,
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
	MicroSeconds_number
} from '../types'
import { SourceMap } from '../model/SourceMap'

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

type SourceNodeLocation = {
	relativeFilePath: UnifiedPath,
	functionIdentifier: SourceNodeIdentifier_string
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

		const sourceNodeIdentifier = cpuNode.sourceNodeIdentifier as LangInternalSourceNodeIdentifier_string
		const langInternalPath = cpuNode.rawUrl as LangInternalPath_string

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
		sourceNodeLocation: SourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo,
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
		sourceNodeLocation: SourceNodeLocation,
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

		if (sourceNodeLocation.functionIdentifier === TypeScriptHelper.awaiterSourceNodeIdentifier()) {
			isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the lastNodeCallInfo is undefined the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			awaiterStack.push({
				awaiter: newLastInternSourceNode,
				awaiterParent: lastNodeCallInfo?.sourceNode
			})
		}

		const awaiterSourceNodeIndex = newLastInternSourceNode.getIndex()?.pathIndex.getSourceNodeIndex(
			'get',
			'{root}.{functionExpression:__awaiter}' as SourceNodeIdentifier_string,
		)

		if (
			!isAwaiterSourceNode &&
			awaiterSourceNodeIndex &&
			accounted.map.has(
				InsertCPUProfileHelper.callIdentifierToString({
					reportID: reportToCredit.internID,
					sourceNodeID: awaiterSourceNodeIndex.id
				}))
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
				lastAwaiterNode.awaiter !== lastNodeCallInfo?.sourceNode
				&& lastAwaiterNode.awaiterParent === newLastInternSourceNode
			) {
				// the async function resolved when the awaiter was called,
				// the last function call was the child function of the awaiter (fulfilled, rejected or step)
				// and the current source node is the async function that called the awaiter

				const awaiterInternChild = newLastInternSourceNode.intern.get(
					awaiterSourceNodeIndex.id
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
		sourceNodeLocation: SourceNodeLocation,
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

	/**
	 * Why does this function exists?
	 * 
	 * Example source code:
	 * 1 methodABC(title, highResolutionStopTime) {
	 * 2         var _a, _b, _c;
	 * 3         return __awaiter(this, void 0, void 0, function* () {
	 * 4         		// do something
	 * 5         });
	 * 6 }
	 * 
	 * If a source mapping exists for every line except line 2 and 3
	 * and the function identifier is requested for line 2 or 3 the source map will return undefined.
	 * 
	 * So the ProgramStructureTree node has to be resolved for that location.
	 * This will return the parent function (methodABC) and its corresponding scope for line 2 and 3,
	 * since the ProgramStructureTree treats the __awaiter function as part of the methodABC function.
	 * 
	 * Then the sourcemap can be used to resolve the original source location of the function methodABC.
	 * 
	 * If the sourcemap still returns undefined,
	 * the requested source code location is not part of the original source code.
	 * 
	 */
	static resolveMappedLocationFromSourceMap(
		programStructureTreeNodeScript: ProgramStructureTree,
		sourceMap: SourceMap,
		lineNumber: number,
		columnNumber: number
	): MappedPosition | undefined {
		const originalPosition = sourceMap.getOriginalSourceLocation(lineNumber, columnNumber)

		// check if position could be resolved
		if (originalPosition && originalPosition.source) {
			return originalPosition
		} else {
			// if position could not be resolved
			// resolve function via ProgramStructureTree and try to resolve the original position again
			const identifierNode = programStructureTreeNodeScript.identifierNodeBySourceLocation(
				{ line: lineNumber, column: columnNumber }
			)
			if (identifierNode === undefined) {
				return undefined
			}
			return sourceMap.getOriginalSourceLocation(
				identifierNode.node.beginLoc.line,
				identifierNode.node.beginLoc.column
			)
		}
	}

	static async resolveFunctionIdentifier(
		rootDir: UnifiedPath,
		cpuNode: CPUNode,
		// script id -> ProgramStructureTree
		programStructureTreePerNodeScript: ModelMap<string, ProgramStructureTree>,
		programStructureTreePerOriginalFile: ModelMap<UnifiedPath_string, ProgramStructureTree>,
		inspectorHelper: InspectorHelper
	): Promise<{
			sourceNodeLocation: SourceNodeLocation,
			functionIdentifierPresentInOriginalFile: boolean
		}> {
		/**
		 * Resolve procedure:
		 * 
		 * Variables to be set:
		 * sourceNodeLocation.relativeFilePath
		 * sourceNodeLocation.functionIdentifier
		 * functionIdentifierPresentInOriginalFile = true (default)
		 * 
		 * if the executed script contains a sourcemap:
		 * 		- get original source location from sourcemap
		 * 		- if original source location is found:
		 * 			- resolve source file path from original source location
		 * 				- if the original source file exists
		 * 					- parse the original source file
		 * 						- if the function identifier is present in the original source file
		 * 							- SET sourceNodeLocation.functionIdentifier =
		 * 								resolved function identifier from original source location
		 * 							- SET sourceNodeLocation.relativeFilePath =
		 * 									relative path of the original source file
		 * 									to the project root or relative to its parent node module
		 * 						- else
		 * 							- SET functionIdentifierPresentInOriginalFile =
		 * 									wether the function identifier is present in the original source file
		 * 				- else, log an error if the file is not part of a node module
		 * 			- else if sourcemap exists
		 * 				- SET functionIdentifierPresentInOriginalFile = false
		 * 
		 * if original source location is not found:
		 * 		- SET sourceNodeLocation.functionIdentifier = function identifier from the executed scripts source code
		 * 		- SET sourceNodeLocation.relativeFilePath =
		 * 				relative path of the executed script to the project root or relative to its parent node module
		 */

		let programStructureTreeNodeScript: ProgramStructureTree | undefined =
			programStructureTreePerNodeScript.get(cpuNode.scriptId)
		let programStructureTreeOriginal: ProgramStructureTree | undefined = undefined
		const { lineNumber, columnNumber } = cpuNode.sourceLocation
		let functionIdentifierPresentInOriginalFile = true
		let sourceNodeLocation: SourceNodeLocation | undefined = undefined

		if (programStructureTreeNodeScript === undefined) {
			// request source code from the node engine
			// (it is already transformed event if it is the original file path)
			const sourceCode = await inspectorHelper.sourceCodeFromId(cpuNode.scriptId)
			if (sourceCode === null) {
				throw new Error(
					'InsertCPUProfileHelper.resolveFunctionIdentifier: sourceCode should not be null' +
					`scriptId: ${cpuNode.scriptId} (${cpuNode.url.toPlatformString()})`
				)
			}
			programStructureTreeNodeScript = TypescriptParser.parseSource(
				cpuNode.url,
				sourceCode
			)
			programStructureTreePerNodeScript.set(cpuNode.scriptId, programStructureTreeNodeScript)
		}

		// function identifier of the executed source code
		const functionIdentifier = programStructureTreeNodeScript.identifierBySourceLocation(
			{ line: lineNumber, column: columnNumber }
		)

		const sourceMap = await inspectorHelper.sourceMapFromId(cpuNode.url, cpuNode.scriptId)
		const originalPosition = sourceMap !== null ? InsertCPUProfileHelper.resolveMappedLocationFromSourceMap(
			programStructureTreeNodeScript,
			sourceMap,
			lineNumber,
			columnNumber
		) : undefined

		if (originalPosition && originalPosition.source) {
			const originalPositionPath = new UnifiedPath(originalPosition.source)
			const absoluteOriginalSourcePath = originalPositionPath.isRelative() ? new UnifiedPath(
				path.resolve(path.join(path.dirname(cpuNode.url.toString()), originalPosition.source))
			) : originalPositionPath

			if (fs.existsSync(absoluteOriginalSourcePath.toPlatformString())) {
				const pureRelativeOriginalSourcePath = rootDir.pathTo(absoluteOriginalSourcePath)
				const relativeOriginalSourcePath = (cpuNode.nodeModulePath && cpuNode.nodeModule)
					? cpuNode.nodeModulePath.pathTo(pureRelativeOriginalSourcePath) :
					pureRelativeOriginalSourcePath

				programStructureTreeOriginal = programStructureTreePerOriginalFile.get(
					pureRelativeOriginalSourcePath.toString()
				)
				if (programStructureTreeOriginal === undefined) {
					// found the original source file from the source map but it is not yet parsed
					programStructureTreeOriginal = inspectorHelper.parseFile(
						pureRelativeOriginalSourcePath,
						absoluteOriginalSourcePath
					)
					programStructureTreePerOriginalFile.set(
						pureRelativeOriginalSourcePath.toString(),
						programStructureTreeOriginal
					)
				}
				const originalFunctionIdentifier = programStructureTreeOriginal.identifierBySourceLocation(
					{ line: originalPosition.line, column: originalPosition.column }
				)
				functionIdentifierPresentInOriginalFile = programStructureTreeOriginal.sourceLocationOfIdentifier(
					functionIdentifier
				) !== undefined
				sourceNodeLocation = {
					relativeFilePath: relativeOriginalSourcePath,
					functionIdentifier: originalFunctionIdentifier
				}
			} else {
				// since node modules often include source maps that point to non-existing files we ignore them
				if (!cpuNode.nodeModulePath || !cpuNode.nodeModule) {
					LoggerHelper.error('InsertCPUProfileHelper.resolveFunctionIdentifier: original source file does not exist', {
						originalPositionSource: originalPosition.source,
						absoluteOriginalSourcePath,
						sources: sourceMap?.sources,
						url: cpuNode.url.toString(),
						lineNumber,
						columnNumber
					})
				}
			}
		} else {
			if (sourceMap) {
				// there is a sourcemap but the original position could not be resolved
				functionIdentifierPresentInOriginalFile = false
			}
		}

		if (sourceNodeLocation === undefined) {
			// if the executed source code is original, has no source map
			// or the source map does not contain the original source location

			sourceNodeLocation = {
				relativeFilePath: cpuNode.relativeSourceFilePath,
				functionIdentifier
			}
		}
		
		if (functionIdentifier === '') {
			LoggerHelper.error('InsertCPUProfileHelper.resolveFunctionIdentifier: functionIdentifier should not be empty', {
				url: cpuNode.url.toString(),
				lineNumber,
				columnNumber
			})
			throw new Error('InsertCPUProfileHelper.resolveFunctionIdentifier: functionIdentifier should not be empty')
		}


		return {
			sourceNodeLocation,
			functionIdentifierPresentInOriginalFile
		}
	}

	static async insertCPUProfile(
		reportToApply: ProjectReport,
		rootDir: UnifiedPath,
		profile: ICpuProfileRaw,
		inspectorHelper: InspectorHelper,
		metricsDataCollection?: MetricsDataCollection,
	) {
		if (reportToApply.executionDetails.highResolutionBeginTime === undefined) {
			throw new Error('InsertCPUProfileHelper.insertCPUProfile: executionDetails.highResolutionBeginTime is undefined')
		}
		const cpuModel = new CPUModel(
			rootDir,
			profile,
			BigInt(reportToApply.executionDetails.highResolutionBeginTime) as NanoSeconds_BigInt
		)
		await inspectorHelper.fillSourceMapsFromCPUModel(cpuModel)

		// script id -> ProgramStructureTree
		const programStructureTreePerNodeScript: ModelMap<string, ProgramStructureTree> =
			new ModelMap<UnifiedPath_string, ProgramStructureTree>('string')

		const programStructureTreePerOriginalFile: ModelMap<UnifiedPath_string, ProgramStructureTree> =
			new ModelMap<UnifiedPath_string, ProgramStructureTree>('string')

		if (metricsDataCollection && metricsDataCollection.items.length > 0) {
			// fill the cpu model with energy values
			cpuModel.energyValuesPerNode = cpuModel.energyValuesPerNodeByMetricsData(metricsDataCollection)
		}
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
			reportToCreditArg: ProjectReport | ModuleReport,
			lastNodeCallInfo: LastNodeCallInfo | undefined,
			accounted: AccountedTracker
		) {
			let reportToCredit = reportToCreditArg
			if (!cpuNode.isExtern && !cpuNode.isLangInternal) {
				reportToCredit = originalReport
			}
			const sourceFileExists =
				fs.existsSync(cpuNode.url.toString()) && fs.statSync(cpuNode.url.toString()).isFile()

			if (!cpuNode.isEmpty && !cpuNode.isLangInternal && !sourceFileExists) {
				throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: Sourcefile does not exist: ' + cpuNode.url)
			}

			let firstTimeVisitedSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let parentSourceNode_CallIdentifier: CallIdentifier | undefined = undefined
			let isAwaiterSourceNode = false
			let newLastInternSourceNode: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined = undefined
			let newReportToCredit: ProjectReport | ModuleReport | undefined = undefined
			if (cpuNode.isLangInternal) {
				const result = await InsertCPUProfileHelper.accountToLangInternal(
					cpuNode,
					reportToCredit,
					lastNodeCallInfo,
					accounted
				)
				firstTimeVisitedSourceNode_CallIdentifier = result.firstTimeVisitedSourceNode_CallIdentifier
				parentSourceNode_CallIdentifier = result.parentSourceNode_CallIdentifier
			} else if (!cpuNode.isEmpty) {
				const {
					sourceNodeLocation,
					functionIdentifierPresentInOriginalFile
				} = await InsertCPUProfileHelper.resolveFunctionIdentifier(
					rootDir,
					cpuNode,
					programStructureTreePerNodeScript,
					programStructureTreePerOriginalFile,
					inspectorHelper
				)

				// add to intern if the source file is not part of a node module
				// or the reportToCredit is the node module that source file belongs to
				const addToIntern =
					!((cpuNode.nodeModulePath && cpuNode.nodeModule))
					|| (
						reportToCredit instanceof ModuleReport
						&& reportToCredit.nodeModule.identifier === cpuNode.nodeModule.identifier
					)

				// this happens for node modules like the jest-runner, that executes the own code
				// the measurements will be credited to the original code rather than the node module that executes it
				const ownCodeGetsExecutedByExternal = cpuNode.nodeModulePath === null &&
					lastNodeCallInfo &&
					lastNodeCallInfo.sourceNode.sourceNodeIndex.pathIndex.moduleIndex.identifier !== '{self}'

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
					if (addToIntern) {
						const result = await InsertCPUProfileHelper.accountToIntern(
							reportToCredit,
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
							cpuNode.nodeModule,
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
					newReportToCredit ? newReportToCredit : reportToCredit,
					child,
					newLastInternSourceNode !== undefined ? {
						report: reportToCredit,
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

		await traverse(
			reportToApply,
			reportToApply,
			cpuModel.getNode(0),
			undefined,
			{
				map: new Map<string, string[]>,
				internMap: new Map<string, boolean>(),
				externMap: new Map<string, boolean>(),
				langInternalMap: new Map<string, boolean>()
			}
		)
	}
}