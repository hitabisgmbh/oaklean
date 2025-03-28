import { CPUModel } from './CPUProfile/CPUModel'
import { CPUNode } from './CPUProfile/CPUNode'
import { TypeScriptHelper } from './TypescriptHelper'
import { LoggerHelper } from './LoggerHelper'
import { ExternalResourceHelper } from './ExternalResourceHelper'
import { ResolveFunctionIdentifierHelper } from './ResolveFunctionIdentifierHelper'

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

class CallIdentifier {
	readonly reportID: number
	readonly sourceNodeID: SourceNodeID_number
	readonly sourceNodeIDString: string

	constructor(reportID: number, sourceNodeID: SourceNodeID_number) {
		this.reportID = reportID
		this.sourceNodeID = sourceNodeID
		this.sourceNodeIDString = `${reportID}:${sourceNodeID}`
	}

	toString() {
		return this.sourceNodeIDString
	}
}

class CallRelationTracker {
	private _map: Map<string, string[]>
	private _internMap: Map<string, boolean>
	private _externMap: Map<string, boolean>
	private _langInternalMap: Map<string, boolean>

	constructor() {
		this._map = new Map<string, string[]>()
		this._internMap = new Map<string, boolean>()
		this._externMap = new Map<string, boolean>()
		this._langInternalMap = new Map<string, boolean>()
	}

	/**
	 * Check if the tracker is empty
	 * 
	 * @returns {boolean} true if the tracker is empty, false otherwise
	 */
	isEmpty() {
		return this._map.size === 0 &&
			this._internMap.size === 0 &&
			this._externMap.size === 0 &&
			this._langInternalMap.size === 0
	}

	/**
	 * Check if the tracker is currently in a headless scope.
	 * Meaning that no intern or extern calls were made yet.
	 */
	currentlyInHeadlessScope() {
		return this._internMap.size === 0 && this._externMap.size === 0
	}

	/**
	 * Returns debug information about the tracker.
	 * 
	 * @returns {object} debug information about the tracker
	 */
	debugInfo() {
		return {
			mapSize: this._map.size,
			internMapSize: this._internMap.size,
			externMapSize: this._externMap.size,
			langInternalMapSize: this._langInternalMap.size
		}
	}

	/**
	 * Remove the last child record from a call.
	 * Is used to remove the last child from a parent call after the child has been traversed.
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the child was removed, false otherwise
	 */
	removeLastChildRecord(callIdentifier: CallIdentifier): boolean {
		const childCalls = this._map.get(callIdentifier.toString())
		if (childCalls === undefined) {
			return false
		}
		childCalls.pop() // remove last child from parent
		return true
	}

	/**
	 * Checks if a function call has child calls recorded (used in recursion tracking).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the call identifier was already visited, false otherwise
	 */
	isCallRecorded(callIdentifier: CallIdentifier) {
		return this._map.has(callIdentifier.toString())
	}

	/**
	 * Checks if a function call has child calls recorded (used in recursion tracking).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the call has child calls recorded, false otherwise
	 */
	hasChildrenRecorded(callIdentifier: CallIdentifier) {
		return (this._map.get(callIdentifier.toString())?.length || 0) >0
	}

	/**
	 * Removes all references to a function call (for cleanup).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 */
	removeCallRecord(callIdentifier: CallIdentifier) {
		const callIdentifierString = callIdentifier.toString()
		this._internMap.delete(callIdentifierString)
		this._externMap.delete(callIdentifierString)
		this._langInternalMap.delete(callIdentifierString)
		this._map.delete(callIdentifierString)
	}

	/**
	 * Ensures that a function call entry exists in the tracker.
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @param {string} kind - The kind of the call (intern, extern, langInternal)
	 * @returns {boolean} true if the call was initialized, false if it was already present
	 */
	initializeCallNodeIfAbsent(
		callIdentifier: CallIdentifier,
		kind: 'intern' | 'extern' | 'langInternal'
	) {
		if (!this.isCallRecorded(callIdentifier)) {
			const callIdentifierString = callIdentifier.toString()
			this._map.set(callIdentifierString, [])
			switch (kind) {
				case 'intern':
					this._internMap.set(callIdentifierString, true)
					break
				case 'extern':
					this._externMap.set(callIdentifierString, true)
					break
				case 'langInternal':
					this._langInternalMap.set(callIdentifierString, true)
					break
			}
			return true
		}
		return false
	}

	/**
	 * Registers a function call as a child of another call.
	 * 
	 * @param {CallIdentifier} self - The call identifier of the child call
	 * @param {CallIdentifier} parent - The call identifier of the parent call
	 * @returns wether the link already existed
	 */
	linkCallToParent(
		self: CallIdentifier,
		parent: CallIdentifier
	): boolean {
		const selfCallIdentifierString = self.toString()
		const parentCallIdentifierString = parent.toString()

		let previousChildCalls = this._map.get(parentCallIdentifierString)
		let alreadyLinked = false
		if (previousChildCalls === undefined) {
			previousChildCalls = []
			this._map.set(parentCallIdentifierString, previousChildCalls)
		} else {
			alreadyLinked = previousChildCalls.includes(selfCallIdentifierString)
		}
		previousChildCalls.push(selfCallIdentifierString)
		return alreadyLinked
	}
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
		reportToCredit: ProjectReport | ModuleReport,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		callRelationTracker: CallRelationTracker
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
		const currentCallIdentifier = new CallIdentifier(
			reportToCredit.internID,
			sourceNode.id
		)
		sourceNode.sensorValues.profilerHits += cpuNode.profilerHits

		if (callRelationTracker.currentlyInHeadlessScope()) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
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
				callRelationTracker.isCallRecorded(currentCallIdentifier)
			)
		)

		if (callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal')
		) {
			firstTimeVisitedSourceNode_CallIdentifier = currentCallIdentifier
		}

		if (lastNodeCallInfo) {
			parentSourceNode_CallIdentifier = new CallIdentifier(
				lastNodeCallInfo.report.internID,
				lastNodeCallInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)
			const langInternalSourceNodeReference = lastNodeCallInfo.sourceNode.addSensorValuesToLangInternal(
				sourceNode.globalIdentifier(),
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
			firstTimeVisitedSourceNode_CallIdentifier,
			parentSourceNode_CallIdentifier
		}
	}

	static async accountOwnCodeGetsExecutedByExternal(
		cpuNode: CPUNode,
		originalReport: ProjectReport,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		callRelationTracker: CallRelationTracker
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
		const currentCallIdentifier = new CallIdentifier(
			originalReport.internID,
			newLastInternSourceNode.id
		)

		newLastInternSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		// add measurements to original source code
		newLastInternSourceNode.addToSensorValues(
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

		// if lastNodeCallInfo === undefined
		// the last call was from a lang internal source node (but within a node module report)
		// this is often a node:vm call within a node module to execute some script of the users code
		if (lastNodeCallInfo !== undefined) {
			// remove aggregated time from last intern source node
			parentSourceNode_CallIdentifier = new CallIdentifier(
				lastNodeCallInfo.report.internID,
				lastNodeCallInfo.sourceNode.id
			)
			// if the parent caller was already recorded once, don't subtract the cpu time from it again
			const sensorValuesCorrected = InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.hasChildrenRecorded(parentSourceNode_CallIdentifier)
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

			// link call to the parent caller
			callRelationTracker.linkCallToParent(
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
		callRelationTracker: CallRelationTracker
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
		const currentCallIdentifier = new CallIdentifier(
			reportToCredit.internID,
			newLastInternSourceNode.id
		)
		newLastInternSourceNode.sensorValues.profilerHits += cpuNode.profilerHits
		newLastInternSourceNode.addToSensorValues(
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
				callRelationTracker.isCallRecorded(
					new CallIdentifier(
						reportToCredit.internID,
						lastAwaiterNode.awaiter.id
					)) && lastAwaiterNode.awaiterParent === newLastInternSourceNode
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
			parentSourceNode_CallIdentifier = new CallIdentifier(
				lastNodeCallInfo.report.internID,
				lastNodeCallInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentSourceNode_CallIdentifier
			)

			const internSourceNodeReference = lastNodeCallInfo.sourceNode.addSensorValuesToIntern(
				newLastInternSourceNode.globalIdentifier(),
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
			newLastInternSourceNode
		}
	}

	static async accountToExtern(
		reportToCredit: ProjectReport | ModuleReport,
		cpuNode: CPUNode,
		nodeModule: NodeModule,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		lastNodeCallInfo: LastNodeCallInfo | undefined,
		callRelationTracker: CallRelationTracker
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
		const currentCallIdentifier = new CallIdentifier(
			report.internID,
			sourceNodeMetaData.id
		)
		sourceNodeMetaData.sensorValues.profilerHits += cpuNode.profilerHits
		sourceNodeMetaData.addToSensorValues(
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

		if (lastNodeCallInfo) {
			parentSourceNode_CallIdentifier = new CallIdentifier(
				lastNodeCallInfo.report.internID,
				lastNodeCallInfo.sourceNode.id
			)
			const alreadyLinked = callRelationTracker.linkCallToParent(
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
					alreadyLinked
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
			originalReport: ProjectReport,
			reportToCredit: ProjectReport | ModuleReport,
			lastNodeCallInfo: LastNodeCallInfo | undefined,
			callRelationTracker: CallRelationTracker
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
					callRelationTracker
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
						callRelationTracker
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
						callRelationTracker
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
						callRelationTracker
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
							callRelationTracker
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
							callRelationTracker
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
				callRelationTracker
			}
		}

		async function traverse(
			originalReport: ProjectReport,
			reportToCredit: ProjectReport | ModuleReport,
			cpuNode: CPUNode,
			lastNodeCallInfo: LastNodeCallInfo | undefined,
			callRelationTracker: CallRelationTracker
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
				callRelationTracker
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
			reportToApply,
			reportToApply,
			cpuModel.getNode(0),
			undefined,
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