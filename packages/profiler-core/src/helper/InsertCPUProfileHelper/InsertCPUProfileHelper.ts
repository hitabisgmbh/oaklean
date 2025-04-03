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

type AccountingCategories = {
	'intern': '' | 'awaiter' | 'wasm' | 'calledFromExtern',
	'extern': '',
	'langInternal': '',
	'empty': ''
}
type AccountingType = {
	[P in keyof AccountingCategories]: `${P}_${AccountingCategories[P]}`;
}[keyof AccountingCategories]
type accountToLangInternal_AccountType = Extract<AccountingType, `langInternal_${string}`>
type accountOwnCodeGetsExecutedByExternal_AccountType = Extract<AccountingType, `${string}_calledFromExtern`>
type accountToIntern_AccountType = Extract<AccountingType, `intern_${string}`>
type accountToExtern_AccountType = Extract<AccountingType, `extern_${string}`>

type AccountingResult = {
	accountingType: AccountingType
	accountedCallIdentifier: CallIdentifier,
	accountedSourceNodeReference:
	SourceNodeMetaData<
	SourceNodeMetaDataType.ExternSourceNodeReference |
	SourceNodeMetaDataType.InternSourceNodeReference |
	SourceNodeMetaDataType.LangInternalSourceNodeReference
	> | undefined | null
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
		parentCallIdentifier: CallIdentifier,
		callRelationTracker: CallRelationTracker
	): Promise<{
			accountingType: accountToLangInternal_AccountType,
			accountedCallIdentifier: CallIdentifier,
			accountedSourceNodeReference:
			SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> | undefined
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> 
		| undefined = undefined

		const sourceNodeIdentifier = cpuNode.sourceLocation.sourceNodeIdentifier as
			LangInternalSourceNodeIdentifier_string
		const langInternalPath = cpuNode.sourceLocation.rawUrl as LangInternalPath_string

		const accountedSourceNode = parentCallIdentifier.report.addToLangInternal(
			langInternalPath,
			sourceNodeIdentifier,
		)
		const currentCallIdentifier = new CallIdentifier(
			parentCallIdentifier.report,
			accountedSourceNode
		)
		accountedSourceNode.sensorValues.profilerHits += cpuNode.profilerHits

		if (callRelationTracker.currentlyInHeadlessScope()) {
			// if no extern or intern calls were tracked yet, add the time to the total of headless cpu time
			// IMPORTANT to change when new measurement type gets added

			parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfCPUTime =
				parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfCPUTime +
				(cpuTime.selfCPUTime || 0) as MicroSeconds_number

			parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption =
				parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfCPUEnergyConsumption +
				(cpuEnergyConsumption.selfCPUEnergyConsumption || 0) as MilliJoule_number

			parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption =
				parentCallIdentifier.report.lang_internalHeadlessSensorValues.selfRAMEnergyConsumption +
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

		currentCallIdentifier.firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'langInternal')

		if (
			// ensure its a source node of type internal
			parentCallIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentCallIdentifier
			)
			currentSourceNodeReference = parentCallIdentifier.sourceNode.addSensorValuesToLangInternal(
				accountedSourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			accountingType: 'langInternal_',
			accountedCallIdentifier: currentCallIdentifier,
			accountedSourceNodeReference: currentSourceNodeReference
		}
	}

	static async accountOwnCodeGetsExecutedByExternal(
		cpuNode: CPUNode,
		originalReport: ProjectReport,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		parentCallIdentifier: CallIdentifier,
		callRelationTracker: CallRelationTracker
	): Promise<{
			accountingType: accountOwnCodeGetsExecutedByExternal_AccountType,
			accountedCallIdentifier: CallIdentifier
			accountedSourceNodeReference: null
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption


		const accountedSourceNode = originalReport.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
		)
		const currentCallIdentifier = new CallIdentifier(
			originalReport,
			accountedSourceNode
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

		currentCallIdentifier.firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		// if parentNodeInfo.sourceNode.type !== SourceNodeMetaDataType.SourceNode
		// the last call was from a lang internal source node (but within a node module report)
		// this is often a node:vm call within a node module to execute some script of the users code
		if (
			// ensure its a source node of type internal
			parentCallIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			// remove aggregated time from last intern source node
			// if the parent caller was already recorded once, don't subtract the cpu time from it again
			const sensorValuesCorrected = InsertCPUProfileHelper.sensorValuesForVisitedNode(
				cpuTime,
				cpuEnergyConsumption,
				ramEnergyConsumption,
				callRelationTracker.hasChildrenRecorded(parentCallIdentifier)
			)

			// IMPORTANT to change when new measurement type gets added
			parentCallIdentifier.sourceNode.sensorValues.aggregatedCPUTime =
				parentCallIdentifier.sourceNode.sensorValues.aggregatedCPUTime -
				(sensorValuesCorrected.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number
			parentCallIdentifier.sourceNode.sensorValues.aggregatedCPUEnergyConsumption =
				parentCallIdentifier.sourceNode.sensorValues.aggregatedCPUEnergyConsumption -
				(sensorValuesCorrected.
					cpuEnergyConsumption.
					aggregatedCPUEnergyConsumption
					|| 0) as MilliJoule_number
			parentCallIdentifier.sourceNode.sensorValues.aggregatedRAMEnergyConsumption =
				parentCallIdentifier.sourceNode.sensorValues.aggregatedRAMEnergyConsumption -
				(sensorValuesCorrected.
					ramEnergyConsumption.
					aggregatedRAMEnergyConsumption
					|| 0) as MilliJoule_number

			// link call to the parent caller
			callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentCallIdentifier
			)
		}

		return {
			accountingType: 'intern_calledFromExtern',
			accountedCallIdentifier: currentCallIdentifier,
			accountedSourceNodeReference: null
		}
	}

	static async accountToIntern(
		cpuNode: CPUNode,
		parentCallIdentifier: CallIdentifier,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		awaiterStack: AwaiterStack,
		callRelationTracker: CallRelationTracker
	): Promise<{
			accountingType: accountToIntern_AccountType,
			accountedCallIdentifier: CallIdentifier,
			accountedSourceNodeReference:
			SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> | undefined,
		}> {
		let accountingType: AccountingType = 'intern_'
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption

		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> | undefined = undefined

		// intern
		const accountedSourceNode = parentCallIdentifier.report.addToIntern(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = new CallIdentifier(
			parentCallIdentifier.report,
			accountedSourceNode
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

		currentCallIdentifier.firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'intern')

		if (sourceNodeLocation.functionIdentifier === TypeScriptHelper.awaiterSourceNodeIdentifier()) {
			accountingType = 'intern_awaiter'
			currentCallIdentifier.isAwaiterSourceNode = true

			// add the awaiter to the stack and the corresponding async function parent
			// if the parentNodeInfo.sourceNode is null or of type lang internal
			// the awaiter is the first function in the call tree
			// this could happen if the was called from node internal functions for example
			awaiterStack.push({
				awaiter: accountedSourceNode,
				awaiterParent: parentCallIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode ?
					(parentCallIdentifier.sourceNode as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>) :
					undefined
			})
		}

		if (
			!currentCallIdentifier.isAwaiterSourceNode &&
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
						parentCallIdentifier.report,
						lastAwaiterNode.awaiter
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
			parentCallIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode &&
			parentCallIdentifier.sourceNode !== accountedSourceNode
		) {
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentCallIdentifier
			)

			currentSourceNodeReference = parentCallIdentifier.sourceNode.addSensorValuesToIntern(
				accountedSourceNode.globalIdentifier(),
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			accountingType,
			accountedCallIdentifier: currentCallIdentifier,
			accountedSourceNodeReference: currentSourceNodeReference
		}
	}

	static async accountToExtern(
		cpuNode: CPUNode,
		parentCallIdentifier: CallIdentifier,
		nodeModule: NodeModule,
		sourceNodeLocation: ResolvedSourceNodeLocation,
		callRelationTracker: CallRelationTracker
	): Promise<{
			accountingType: accountToExtern_AccountType,
			accountedCallIdentifier: CallIdentifier,
			accountedSourceNodeReference:
			SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> | undefined,
		}> {
		const cpuTime = cpuNode.cpuTime
		const cpuEnergyConsumption = cpuNode.cpuEnergyConsumption
		const ramEnergyConsumption = cpuNode.ramEnergyConsumption
		let currentSourceNodeReference:
		SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> | undefined = undefined

		const globalIdentifier = new GlobalIdentifier(
			sourceNodeLocation.relativeFilePath.toString(),
			sourceNodeLocation.functionIdentifier,
			nodeModule
		)

		// extern
		const { report, sourceNodeMetaData } = parentCallIdentifier.report.addToExtern(
			sourceNodeLocation.relativeFilePath,
			nodeModule,
			sourceNodeLocation.functionIdentifier
		)
		const currentCallIdentifier = new CallIdentifier(
			report,
			sourceNodeMetaData
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

		currentCallIdentifier.firstTimeVisited = callRelationTracker.initializeCallNodeIfAbsent(
			currentCallIdentifier,
			'extern')

		if (
			// ensure its a source node of type internal
			parentCallIdentifier.sourceNode?.type === SourceNodeMetaDataType.SourceNode
		) {
			const alreadyLinked = callRelationTracker.linkCallToParent(
				currentCallIdentifier,
				parentCallIdentifier
			)
			// add to this source node as well
			currentSourceNodeReference = parentCallIdentifier.sourceNode.addSensorValuesToExtern(
				globalIdentifier,
				InsertCPUProfileHelper.sensorValuesForVisitedNode(
					cpuTime,
					cpuEnergyConsumption,
					ramEnergyConsumption,
					alreadyLinked
				)
			)
			currentSourceNodeReference.sensorValues.profilerHits += cpuNode.profilerHits
		}

		return {
			accountingType: 'extern_',
			accountedCallIdentifier: currentCallIdentifier,
			accountedSourceNodeReference: currentSourceNodeReference
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
		const callRelationTracker = new CallRelationTracker()

		function afterTraverse(
			parentCallIdentifier: CallIdentifier,
			accountedCallIdentifier: CallIdentifier,
			newLinkWasCreated: boolean
		) {
			// equivalent to leave node since after child traverse
			if (newLinkWasCreated) {
				if (!callRelationTracker.removeLastChildRecord(parentCallIdentifier)) {
					throw new Error('InsertCPUProfileHelper.insertCPUProfile.traverse: expected childCalls to be present')
				}
			}
			if (accountedCallIdentifier.firstTimeVisited) {
				callRelationTracker.removeCallRecord(accountedCallIdentifier)
			}
			if (accountedCallIdentifier.isAwaiterSourceNode) {
				awaiterStack.pop()
			}
		}

		async function beforeTraverse(
			cpuNode: CPUNode,
			parentCallIdentifier: CallIdentifier
		): Promise<AccountingResult> {
			let accountingResult: AccountingResult | undefined
			
			if (cpuNode.sourceLocation.isLangInternal) {
				const result = await InsertCPUProfileHelper.accountToLangInternal(
					cpuNode,
					parentCallIdentifier,
					callRelationTracker
				)
				accountingResult = result
			} else if (cpuNode.sourceLocation.isWASM) {
				const wasmPath = new UnifiedPath(cpuNode.sourceLocation.rawUrl.substring(7)) // remove the 'wasm://' prefix

				if (
					parentCallIdentifier.report instanceof ModuleReport &&
					parentCallIdentifier.report.nodeModule === WASM_NODE_MODULE
				) {
					// is part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToIntern(
						cpuNode,
						parentCallIdentifier,
						{
							relativeFilePath: wasmPath,
							functionIdentifier: 
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						awaiterStack,
						callRelationTracker
					)
					accountingResult = result
				} else {
					// is not part of the wasm node module
					const result = await InsertCPUProfileHelper.accountToExtern(
						cpuNode,
						parentCallIdentifier,
						WASM_NODE_MODULE,
						{
							relativeFilePath: wasmPath,
							functionIdentifier:
								cpuNode.sourceLocation.rawFunctionName as SourceNodeIdentifier_string
						},
						callRelationTracker
					)
					accountingResult = result
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
						parentCallIdentifier.sourceNode?.sourceNodeIndex.pathIndex.moduleIndex.identifier !== '{self}' ||
						// the last call originates from the node engine (like node:vm)
						// but the last recorded report was from a node module
						parentCallIdentifier.report !== originalReport
					)

				if (ownCodeGetsExecutedByExternal) {
					const result = await InsertCPUProfileHelper.accountOwnCodeGetsExecutedByExternal(
						cpuNode,
						originalReport,
						sourceNodeLocation,
						parentCallIdentifier,
						callRelationTracker
					)
					accountingResult = result
				} else {
					// add to intern if the source file is not part of a node module
					// or the reportToCredit is the node module that source file belongs to
					if (
						!((relativeNodeModulePath && nodeModule)) || (
							parentCallIdentifier.report instanceof ModuleReport
							&& parentCallIdentifier.report.nodeModule.identifier === nodeModule.identifier
						)
					) {
						// add to intern
						const result = await InsertCPUProfileHelper.accountToIntern(
							cpuNode,
							parentCallIdentifier,
							sourceNodeLocation,
							awaiterStack,
							callRelationTracker
						)
						accountingResult = result
					} else {
						// add to extern
						const result = await InsertCPUProfileHelper.accountToExtern(
							cpuNode,
							parentCallIdentifier,
							nodeModule,
							sourceNodeLocation,
							callRelationTracker
						)
						accountingResult = result
					}
				}

				if (accountingResult.accountedCallIdentifier.sourceNode === null) {
					throw new Error('InsertCPUProfileHelper.insertCPUProfile: expected a source node')
				}
				accountingResult.accountedCallIdentifier.sourceNode.presentInOriginalSourceCode =
				functionIdentifierPresentInOriginalFile
			}
			if (accountingResult === undefined) {
				// default result
				return {
					accountingType: 'empty_',
					accountedCallIdentifier: parentCallIdentifier,
					accountedSourceNodeReference: undefined
				}
			}

			return accountingResult
		}

		async function traverse(
			parentCallIdentifier: CallIdentifier,
			cpuNode: CPUNode
		) {
			const {
				accountingType,
				accountedCallIdentifier,
				accountedSourceNodeReference
			} = await beforeTraverse(
				cpuNode,
				parentCallIdentifier
			)

			for (const child of cpuNode.children()) {
				await traverse(
					accountedCallIdentifier,
					child
				)
			}
			
			// if the accountedSourceNodeReference is not undefined (which only happens for the root node)
			// a link was created to the parent call identifier within the callRelationTracker
			const newLinkWasCreated = accountedSourceNodeReference !== undefined
			afterTraverse(
				parentCallIdentifier,
				accountedCallIdentifier,
				newLinkWasCreated
			)
		}

		await traverse(
			new CallIdentifier(
				reportToApply,
				null
			),
			cpuModel.getNode(0)
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