import * as fs from 'fs'

import axios from 'axios'
import FormData from 'form-data'

import { NodeModule } from './NodeModule'
import { ProfilerConfig } from './ProfilerConfig'
import { Report } from './Report'
import { SystemInformation } from './SystemInformation'
import { MetricsDataCollection } from './interfaces/MetricsDataCollection'
import { GlobalIndex } from './index/GlobalIndex'
import { ModuleIndex } from './index/ModuleIndex'

import { BaseAdapter } from '../adapters/transformer/BaseAdapter'
import { GitHelper } from '../helper/GitHelper'
import type { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto } from '../system/Crypto'
import { BufferHelper } from '../helper/BufferHelper'
import { AuthenticationHelper } from '../helper/AuthenticationHelper'
import { InsertCPUProfileHelper } from '../helper/InsertCPUProfileHelper'
import { BIN_FILE_MAGIC } from '../constants/app'
// Types
import {
	ReportKind,
	ReportType,
	IProjectReportExecutionDetails,
	IProjectMetaData,
	ProjectReportOrigin,
	IProjectReport
} from '../types'

export class ProjectReport extends Report {
	executionDetails: IProjectReportExecutionDetails
	projectMetaData: IProjectMetaData
	globalIndex: GlobalIndex

	constructor(
		executionDetails: IProjectReportExecutionDetails,
		kind: ReportKind,
		projectMetaData?: IProjectMetaData,
		globalIndex?: GlobalIndex,
		config?: ProfilerConfig | null
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
			if (usedConfig === null) {
				throw new Error('ProjectReport: no config was provided')
			}
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
				currentProjectReport.executionDetails.commitHash !== executionDetails.commitHash
			) {
				throw new Error('ProjectReport.merge: Project reports commit hashs are not the same')
			}
			if (currentProjectReport.executionDetails.origin !== executionDetails.origin) {
				throw new Error('ProjectReport.merge: Project reports have different origins')
			}
			if (executionDetails.uncommittedChanges || currentProjectReport.executionDetails.uncommittedChanges) {
				executionDetails.uncommittedChanges = true
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
		json: string | IProjectReport
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
			null
		)

		const result = Object.assign(
			projectReport,
			Report.fromJSONReport(data, projectReport.moduleIndex)
		)

		return result
	}

	static loadFromFile(
		filePath: UnifiedPath,
		kind: 'json' | 'bin'
	): ProjectReport | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		switch (kind) {
			case 'json':
				return ProjectReport.fromJSON(
					fs.readFileSync(filePath.toPlatformString()).toString()
				)
			case 'bin': {
				const { instance } = ProjectReport.consumeFromBuffer(
					fs.readFileSync(filePath.toPlatformString())
				)
				return instance
			}
			default:
				break
		}
		
	}

	async trackUncommittedFiles(rootDir: UnifiedPath) {
		// if git is not available, set default value of uncommitted changes to undefined
		this.executionDetails.uncommittedChanges = undefined
		const uncommittedFiles = GitHelper.uncommittedFiles()

		if (uncommittedFiles === undefined) {
			return
		}
		// git is available, set default value of uncommitted changes to false
		this.executionDetails.uncommittedChanges = false
		for (const uncommittedFile of uncommittedFiles) {
			const pureRelativeOriginalSourcePath = rootDir.pathTo(new UnifiedPath(uncommittedFile))

			const pathIndex = this.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', pureRelativeOriginalSourcePath.toString())
			if (pathIndex === undefined) {
				continue
			}
			pathIndex.containsUncommittedChanges = true
			// if one file has uncommitted changes, the whole project has uncommitted changes
			this.executionDetails.uncommittedChanges = true
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

	async shouldBeStoredInRegistry() {
		// every accumulated report should be stored in the registry
		// and every report that was not created in the jest environment should be stored in the registry
		return this.executionDetails.origin !== ProjectReportOrigin.jestEnv || this.kind === ReportKind.accumulated
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
				null
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
				timeout: 5000, // Set a timeout of 5 seconds
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			return result	
		} catch {}
	}
}
