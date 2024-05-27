import * as fs from 'fs'

import axios from 'axios'
import FormData from 'form-data'

import { NodeModule } from './NodeModule'
import { ProfilerConfig, RuntimeOptions } from './ProfilerConfig'
import { IReport, Report, ReportKind, ReportType } from './Report'
import { SystemInformation, ISystemInformation } from './SystemInformation'
import { MetricsDataCollection } from './interfaces/MetricsDataCollection'
import { GlobalIndex, IGlobalIndex } from './index/GlobalIndex'
import { ModuleIndex } from './index/ModuleIndex'

import { BaseAdapter } from '../adapters/transformer/BaseAdapter'
import { GitHelper, GitHash_string } from '../helper/GitHelper'
import { TimeHelper } from '../helper/TimeHelper'
import type { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto, UUID_string } from '../system/Crypto'
import { BufferHelper } from '../helper/BufferHelper'
import { AuthenticationHelper } from '../helper/AuthenticationHelper'
import { InsertCPUProfileHelper } from '../helper/InsertCPUProfileHelper'
import { BIN_FILE_MAGIC } from '../constants/app'

const ProjectIdentifierSymbol: unique symbol = Symbol('ProjectIdentifierSymbol')
export type ProjectIdentifier_string = UUID_string & { [ProjectIdentifierSymbol]: never }

export type IProjectMetaData = {
	projectID: ProjectIdentifier_string
}

export type ILanguageInformation = {
	name: string,
	version: string
}
export enum ProjectReportOrigin {
	pure = 'pure', // if measurements were made via the pure profiler, without the profiler-jest-environment
	jestEnv = 'profiler-jest-environment' // if measurements were made via the profiler-jest-environment
}
export type IProjectReportExecutionDetails = {
	origin: ProjectReportOrigin,
	commitHash: GitHash_string | undefined
	uncommittedChanges: boolean | undefined
	timestamp: number
	highResolutionBeginTime?: string // value is stored in nano seconds(NanoSeconds_BigInt), but for serialization purposes it is a string
	highResolutionStopTime?: string // value is stored in nano seconds(NanoSeconds_BigInt), but for serialization purposes it is a string
	systemInformation: ISystemInformation,
	languageInformation: ILanguageInformation
	runTimeOptions: RuntimeOptions
}

export interface IProjectReport extends IReport {
	projectMetaData: IProjectMetaData
	executionDetails: IProjectReportExecutionDetails,
	globalIndex: IGlobalIndex
}

export class ProjectReport extends Report {
	executionDetails: IProjectReportExecutionDetails
	projectMetaData: IProjectMetaData
	globalIndex: GlobalIndex

	constructor(
		executionDetails: IProjectReportExecutionDetails,
		kind: ReportKind,
		projectMetaData?: IProjectMetaData,
		globalIndex?: GlobalIndex,
		config?: ProfilerConfig
	) {
		let index = globalIndex
		if (index === undefined) {
			index = new GlobalIndex(new NodeModule(
				executionDetails.languageInformation.name,
				executionDetails.languageInformation.version
			))
		}
		super(index.getModuleIndex('upsert'), kind)
		this.globalIndex = index
	
		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		this.executionDetails = executionDetails

		if (projectMetaData) {
			this.projectMetaData = projectMetaData
		} else {
			this.projectMetaData = {
				projectID: usedConfig.getProjectIdentifier()
			}
		}
	}

	normalize() {
		const newGlobalIndex = new GlobalIndex(this.engineModule)
		super.normalize(newGlobalIndex)
		this.globalIndex = newGlobalIndex
	}

	public get engineModule() : NodeModule {
		return this.globalIndex.engineModule
	}

	static async resolveExecutionDetails(config?: ProfilerConfig): Promise<IProjectReportExecutionDetails> {
		const commitHash = GitHelper.currentCommitHash()
		const timestamp = TimeHelper.getCurrentTimeStamp()
		const uncommittedChanges = GitHelper.uncommittedChanges()

		if (commitHash === undefined || timestamp === undefined || uncommittedChanges === undefined) {
			throw new Error('ProjectReport.resolveExecutionDetails: Could not resolve execution details.' + JSON.stringify({
				commitHash: commitHash,
				timestamp: timestamp,
				uncommittedChanges: uncommittedChanges
			}, undefined, 2))
		}
		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		const engineModule = NodeModule.currentEngineModule()

		return {
			origin: ProjectReportOrigin.pure,
			commitHash: commitHash,
			timestamp: timestamp,
			uncommittedChanges: uncommittedChanges,
			systemInformation: await SystemInformation.collect(),
			languageInformation: {
				name: engineModule.name,
				version: engineModule.version
			},
			runTimeOptions: usedConfig.getAnonymizedRuntimeOptions()
		}
	}

	isCompatibleWith(other: ProjectReport) {
		return this.reportVersion === other.reportVersion
	}

	static merge(
		moduleIndex: ModuleIndex,
		...args: ProjectReport[]
	): ProjectReport {
		if (args.length === 0) {
			throw new Error('ProjectReport.merge: no ProjectReports were given')
		}

		const systemInformationList = args.map((x) => x.executionDetails.systemInformation)

		if (!SystemInformation.sameSystem(...systemInformationList)) {
			throw new Error('ProjectReport.merge: cannot merge ProjectReports from different systems')
		}
		const executionDetails = args[0].executionDetails

		for (const currentProjectReport of args) {
			if (
				currentProjectReport.executionDetails.commitHash !== executionDetails.commitHash ||
				currentProjectReport.executionDetails.uncommittedChanges !== executionDetails.uncommittedChanges
			) {
				throw new Error('ProjectReport.merge: Project reports commit hashs are not the same')
			}
			if (currentProjectReport.executionDetails.origin !== executionDetails.origin) {
				throw new Error('ProjectReport.merge: Project reports have different origins')
			}
			if (currentProjectReport.executionDetails.timestamp < executionDetails.timestamp) {
				// set execution timestamp to the earliest
				// if e.g. multiple test reports are merged, the first report marks the first test execution
				executionDetails.timestamp = currentProjectReport.executionDetails.timestamp

				// only keep the system information of the first report
				executionDetails.systemInformation = currentProjectReport.executionDetails.systemInformation
			}
		}

		const result = Object.assign(
			new ProjectReport(executionDetails, ReportKind.accumulated),
			Report.merge(moduleIndex, ...args)
		)
		result.globalIndex = moduleIndex.globalIndex
		return result
	}

	toJSON(): IProjectReport {
		if (process.env.NODE_ENV === 'test') {
			this.validate()
		}
		const reportJSON = super.toJSON()
		const result = {
			projectMetaData: this.projectMetaData,
			executionDetails: this.executionDetails,
			globalIndex: this.globalIndex.toJSON()
		}

		return Object.assign(result, reportJSON)
	}

	static fromJSON(
		json: string | IProjectReport,
		config?: ProfilerConfig
	): ProjectReport {
		let data: IProjectReport
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const projectReport = new ProjectReport(
			data.executionDetails,
			data.kind,
			data.projectMetaData,
			GlobalIndex.fromJSON(data.globalIndex, new NodeModule(
				data.executionDetails.languageInformation.name,
				data.executionDetails.languageInformation.version
			)),
			config
		)

		const result = Object.assign(
			projectReport,
			Report.fromJSONReport(data, projectReport.moduleIndex)
		)

		return result
	}

	static loadFromFile(
		filePath: UnifiedPath,
		kind: 'json' | 'bin',
		config?: ProfilerConfig
	): ProjectReport | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		switch (kind) {
			case 'json':
				return ProjectReport.fromJSON(
					fs.readFileSync(filePath.toPlatformString()).toString(),
					config
				)
			case 'bin': {
				const { instance } = ProjectReport.consumeFromBuffer(
					fs.readFileSync(filePath.toPlatformString()),
					config
				)
				return instance
			}
			default:
				break
		}
		
	}

	async insertCPUProfile(
		rootDir: UnifiedPath,
		profile: ICpuProfileRaw,
		transformerAdapter?: BaseAdapter,
		metricsDataCollection?: MetricsDataCollection
	) {
		await InsertCPUProfileHelper.insertCPUProfile(
			this,
			rootDir,
			profile,
			transformerAdapter,
			metricsDataCollection
		)
	}

	storeToFile(
		filePath: UnifiedPath,
		kind: 'pretty-json' | 'json' | 'bin',
		config?: ProfilerConfig
	) {
		super.storeToFileReport(filePath, kind, ReportType.ProjectReport, config)
	}

	toBuffer(): Buffer {
		const buffers = [
			BIN_FILE_MAGIC,
			BufferHelper.String2LToBuffer(this.reportVersion),
			BufferHelper.String2LToBuffer(JSON.stringify(this.executionDetails)),
			BufferHelper.String2LToBuffer(JSON.stringify(this.projectMetaData)),
			BufferHelper.String4LToBuffer(JSON.stringify(this.globalIndex)),
			super.toBuffer(ReportType.ProjectReport)
		]

		return Buffer.concat(buffers)
	}

	static versionFromBinFile(filePath: UnifiedPath) {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return ProjectReport.versionFromBuffer(fs.readFileSync(filePath.toPlatformString()))
	}

	static versionFromBuffer(
		buffer: Buffer
	) {
		let remainingBuffer = buffer
		if (buffer.byteLength < 2) {
			throw new Error('ProjectReport.consumeFromBuffer: not enough bytes remaining')
		}
		const magic = buffer.subarray(0, BIN_FILE_MAGIC.length)
		if (magic.compare(BIN_FILE_MAGIC) !== 0) {
			throw new Error('ProjectReport.consumeFromBuffer: not a binary .oak format')
		}
		remainingBuffer = buffer.subarray(BIN_FILE_MAGIC.length)
		const {
			instance: reportVersion,
			remainingBuffer: newRemainingBuffer0
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		return reportVersion
	}

	static consumeFromBuffer(
		buffer: Buffer,
		config?: ProfilerConfig
	) {
		let remainingBuffer = buffer
		if (buffer.byteLength < 2) {
			throw new Error('ProjectReport.consumeFromBuffer: not enough bytes remaining')
		}
		const magic = buffer.subarray(0, BIN_FILE_MAGIC.length)
		if (magic.compare(BIN_FILE_MAGIC) !== 0) {
			throw new Error('ProjectReport.consumeFromBuffer: not a binary .oak format')
		}
		remainingBuffer = buffer.subarray(BIN_FILE_MAGIC.length)
		const {
			instance: reportVersion,
			remainingBuffer: newRemainingBuffer0
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		const {
			instance: executionDetails_JSON_string,
			remainingBuffer: newRemainingBuffer1
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1
		const executionDetails = JSON.parse(executionDetails_JSON_string) as IProjectReportExecutionDetails

		const {
			instance: projectMetaData_JSON_string,
			remainingBuffer: newRemainingBuffer2
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2
		const projectMetaData = JSON.parse(projectMetaData_JSON_string) as IProjectMetaData

		const {
			instance: globalIndex_JSON_string,
			remainingBuffer: newRemainingBuffer3
		} = BufferHelper.String4LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer3

		const globalIndex = GlobalIndex.fromJSON(
			globalIndex_JSON_string,
			new NodeModule(
				executionDetails.languageInformation.name,
				executionDetails.languageInformation.version
			)
		)
		const {
			instance: report,
			type: reportType,
			remainingBuffer: newRemainingBuffer4
		} = Report.consumeFromBufferReport(remainingBuffer, globalIndex.getModuleIndex('get'))
		remainingBuffer = newRemainingBuffer4

		const result = Object.assign(
			new ProjectReport(
				executionDetails,
				report.kind,
				projectMetaData,
				globalIndex,
				config
			),
			report
		)

		return {
			instance: result,
			type: reportType,
			remainingBuffer
		}
	}

	hash() {
		return Crypto.hash(this.toBuffer())
	}

	static hashFromBinFile(
		filePath: UnifiedPath
	): string | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return Crypto.hash(fs.readFileSync(filePath.toPlatformString()))
	}

	async uploadToRegistry(config?: ProfilerConfig) {
		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		if (!usedConfig.uploadEnabled()) {
			return
		}

		const compressedBuffer = await BufferHelper.compressBuffer(this.toBuffer())

		const formData = new FormData()
		formData.append('file', compressedBuffer, 'filename.txt')
		formData.append('auth', AuthenticationHelper.getAuthentication())

		try {
			const result = await axios.post(usedConfig.getRegistryUploadUrl(), formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			console.log(result.data)
			return result	
		} catch {}
	}
}
