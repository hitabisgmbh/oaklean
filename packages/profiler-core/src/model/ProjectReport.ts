import * as fs from 'fs'

import { NodeModule } from './NodeModule'
import { ProfilerConfig } from './ProfilerConfig'
import { Report } from './Report'
import { SystemInformation } from './SystemInformation'
import { MetricsDataCollection } from './interfaces/MetricsDataCollection'
import { GlobalIndex } from './indices/GlobalIndex'
import { ModuleIndex } from './indices/ModuleIndex'
import { SourceNodeGraph } from './SourceNodeGraph'

import type { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { REPORT_FILE_EXTENSION, NODE_ENV, BIN_FILE_MAGIC } from '../constants'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto } from '../system/Crypto'
import { BufferHelper } from '../helper/BufferHelper'
import { ExternalResourceHelper } from '../helper/ExternalResourceHelper'
import { ResolveFunctionIdentifierHelper } from '../helper/ResolveFunctionIdentifierHelper'
import { InsertCPUProfileStateMachine } from '../helper/InsertCPUProfileHelper/InsertCPUProfileStateMachine'
// Types
import {
	ReportKind,
	ReportType,
	IProjectMetaData,
	ProjectReportOrigin,
	IProjectReport,
	IProjectReportExecutionDetails
} from '../types'

export class ProjectReport extends Report {
	executionDetails: IProjectReportExecutionDetails
	projectMetaData: IProjectMetaData
	globalIndex: GlobalIndex

	private _sourceNodeGraph: SourceNodeGraph | undefined

	constructor(
		executionDetails: IProjectReportExecutionDetails,
		kind: ReportKind,
		projectMetaData?: IProjectMetaData,
		globalIndex?: GlobalIndex,
		config?: ProfilerConfig | null
	) {
		let index = globalIndex
		if (index === undefined) {
			index = new GlobalIndex(
				new NodeModule(executionDetails.languageInformation.name, executionDetails.languageInformation.version)
			)
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

	asSourceNodeGraph(): SourceNodeGraph {
		if (this._sourceNodeGraph === undefined) {
			const graph = SourceNodeGraph.fromProjectReport(this)
			this._sourceNodeGraph = graph
		}
		return this._sourceNodeGraph
	}

	normalize() {
		const newGlobalIndex = new GlobalIndex(this.engineModule)
		super.normalize(newGlobalIndex)
		this.globalIndex = newGlobalIndex
	}

	public get engineModule(): NodeModule {
		return this.globalIndex.engineModule
	}

	isCompatibleWith(other: ProjectReport) {
		return this.reportVersion === other.reportVersion
	}

	static merge(moduleIndex: ModuleIndex, ...args: ProjectReport[]): ProjectReport {
		if (args.length === 0) {
			throw new Error('ProjectReport.merge: no ProjectReports were given')
		}

		const sortedReports = [...args].sort((reportA, reportB) => {
			const compared =
				BigInt(reportA.executionDetails.highResolutionBeginTime) -
				BigInt(reportB.executionDetails.highResolutionBeginTime)

			if (compared > BigInt(0)) {
				return 1
			} else if (compared < BigInt(0)) {
				return -1
			}
			return 0
		})

		const systemInformationList = sortedReports.map((x) => x.executionDetails.systemInformation)

		if (!SystemInformation.sameSystem(...systemInformationList)) {
			throw new Error('ProjectReport.merge: cannot merge ProjectReports from different systems')
		}
		const executionDetails = sortedReports[0].executionDetails

		for (const currentProjectReport of sortedReports) {
			if (currentProjectReport.executionDetails.commitHash !== executionDetails.commitHash) {
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
			Report.merge(moduleIndex, ...sortedReports)
		)
		result.globalIndex = moduleIndex.globalIndex
		return result
	}

	toJSON(): IProjectReport {
		if (NODE_ENV === 'test') {
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

	static fromJSON(json: string | IProjectReport): ProjectReport {
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
			GlobalIndex.fromJSON(
				data.globalIndex,
				new NodeModule(
					data.executionDetails.languageInformation.name,
					data.executionDetails.languageInformation.version
				)
			),
			null
		)

		const result = Object.assign(projectReport, Report.fromJSONReport(data, projectReport.moduleIndex))

		return result
	}

	static loadFromFile(filePath: UnifiedPath, kind: 'json' | 'bin'): ProjectReport | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		switch (kind) {
			case 'json':
				return ProjectReport.fromJSON(fs.readFileSync(filePath.toPlatformString()).toString())
			case 'bin': {
				const { instance } = ProjectReport.consumeFromBuffer(fs.readFileSync(filePath.toPlatformString()))
				return instance
			}
			default:
				break
		}
	}

	trackUncommittedFiles(rootDir: UnifiedPath, externalResourceHelper: ExternalResourceHelper) {
		// if git is not available, set default value of uncommitted changes to undefined
		this.executionDetails.uncommittedChanges = undefined
		const containsUncommittedChanges = externalResourceHelper.trackUncommittedFiles(rootDir, this.globalIndex)

		if (containsUncommittedChanges === null) {
			// git is not available
			return
		}
		this.executionDetails.uncommittedChanges = containsUncommittedChanges
	}

	async insertCPUProfile(
		rootDir: UnifiedPath,
		profile: ICpuProfileRaw,
		externalResourceHelper: ExternalResourceHelper,
		metricsDataCollection?: MetricsDataCollection
	) {
		const stateMachine = new InsertCPUProfileStateMachine(this)
		const resolveFunctionIdentifierHelper = new ResolveFunctionIdentifierHelper(rootDir, externalResourceHelper)
		await stateMachine.insertCPUProfile(rootDir, resolveFunctionIdentifierHelper, profile, metricsDataCollection)
	}

	storeToFile(filePath: UnifiedPath, kind: 'pretty-json' | 'json' | 'bin', config?: ProfilerConfig) {
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

	static versionFromBuffer(buffer: Buffer) {
		let remainingBuffer = buffer
		if (buffer.byteLength < 2) {
			throw new Error('ProjectReport.consumeFromBuffer: not enough bytes remaining')
		}
		const magic = buffer.subarray(0, BIN_FILE_MAGIC.length)
		if (magic.compare(BIN_FILE_MAGIC) !== 0) {
			throw new Error(`ProjectReport.consumeFromBuffer: not a binary ${REPORT_FILE_EXTENSION} format`)
		}
		remainingBuffer = buffer.subarray(BIN_FILE_MAGIC.length)
		const { instance: reportVersion, remainingBuffer: newRemainingBuffer0 } =
			BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		return reportVersion
	}

	static consumeFromBuffer(
		buffer: Buffer,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		config?: ProfilerConfig
	) {
		let remainingBuffer = buffer
		if (buffer.byteLength < 2) {
			throw new Error('ProjectReport.consumeFromBuffer: not enough bytes remaining')
		}
		const magic = buffer.subarray(0, BIN_FILE_MAGIC.length)
		if (magic.compare(BIN_FILE_MAGIC) !== 0) {
			throw new Error(`ProjectReport.consumeFromBuffer: not a binary ${REPORT_FILE_EXTENSION} format`)
		}
		remainingBuffer = buffer.subarray(BIN_FILE_MAGIC.length)
		const {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			instance: reportVersion,
			remainingBuffer: newRemainingBuffer0
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		const { instance: executionDetails_JSON_string, remainingBuffer: newRemainingBuffer1 } =
			BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1
		const executionDetails = JSON.parse(executionDetails_JSON_string) as IProjectReportExecutionDetails

		const { instance: projectMetaData_JSON_string, remainingBuffer: newRemainingBuffer2 } =
			BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2
		const projectMetaData = JSON.parse(projectMetaData_JSON_string) as IProjectMetaData

		const { instance: globalIndex_JSON_string, remainingBuffer: newRemainingBuffer3 } =
			BufferHelper.String4LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer3

		const globalIndex = GlobalIndex.fromJSON(
			globalIndex_JSON_string,
			new NodeModule(executionDetails.languageInformation.name, executionDetails.languageInformation.version)
		)
		const {
			instance: report,
			type: reportType,
			remainingBuffer: newRemainingBuffer4
		} = Report.consumeFromBufferReport(remainingBuffer, globalIndex.getModuleIndex('get'))
		remainingBuffer = newRemainingBuffer4

		const result = Object.assign(
			new ProjectReport(executionDetails, report.kind, projectMetaData, globalIndex, null),
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

	static hashFromBinFile(filePath: UnifiedPath): string | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return Crypto.hash(fs.readFileSync(filePath.toPlatformString()))
	}
}
