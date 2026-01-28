import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import { NodeModule } from './NodeModule'
import {
	AggregatedSourceNodeMetaData,
	SourceFileMetaData
} from './SourceFileMetaData'
import { SourceNodeMetaData } from './SourceNodeMetaData'
import { ProfilerConfig } from './ProfilerConfig'
import { SensorValues } from './SensorValues'
import { ModuleIndex } from './indices/ModuleIndex'
import { GlobalIndex } from './indices/GlobalIndex'
import { PathIndex } from './indices/PathIndex'

import { NODE_ENV } from '../constants/env'
import { VERSION } from '../constants/app'
import { PermissionHelper } from '../helper/PermissionHelper'
import { UnifiedPath } from '../system/UnifiedPath'
import { BufferHelper } from '../helper/BufferHelper'
import { VersionHelper } from '../helper/VersionHelper'
// Types
import {
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	SourceNodeIdentifier_string,
	UnifiedPath_string,
	SourceNodeMetaDataType,
	ReportKind,
	NodeModuleIdentifier_string,
	ModuleID_number,
	IndexRequestType,
	PathID_number,
	IReport,
	ReportType,
	ISourceFileMetaData,
	IModuleReport,
	SourceNodeID_number,
	SourceNodeMetaDataType_Node
} from '../types'

// global variable to assign an intern id to every report
// the intern id is only used to uniquely identify a report within a project report,
// since there could be multiple module reports for the same node module (but as a child of another module report)
let currentInternID = 0

export class Report extends BaseModel {
	reportVersion: string
	kind: ReportKind
	relativeRootDir?: UnifiedPath
	private _headlessSensorValues?: SensorValues
	private _lang_internal?: ModelMap<PathID_number, SourceFileMetaData>
	private _intern?: ModelMap<PathID_number, SourceFileMetaData>
	private _extern?: ModelMap<ModuleID_number, ModuleReport>

	// counts internIDs for all reports (is only stored on the root report)
	internID: number

	// the part of the index that represents this report
	moduleIndex: ModuleIndex

	constructor(moduleIndex: ModuleIndex, kind: ReportKind) {
		super()
		this.reportVersion = VERSION
		this.kind = kind
		this.moduleIndex = moduleIndex
		this.internID = currentInternID++
	}

	/**
	 * Resolve a source node ID to its corresponding source node metadata within this report.
	 * @param report - The report to which the source node belongs (necessary for lang internal and extern).
	 * @param globalIndex - The global index of the project report.
	 * @param sourceNodeID - The unique identifier of the source node to resolve.
	 * @returns An object containing either the resolved report, source file metadata, and source node metadata,
	 *          or an error indication if the resolution fails.
	 */
	resolveSourceNodeID(
		globalIndex: GlobalIndex,
		sourceNodeID: SourceNodeID_number
	):
		| {
				error: true
		  }
		| {
				error: true
				report: ProjectReport | ModuleReport
		  }
		| {
				error: true
				report: ProjectReport | ModuleReport
				sourceFileMetaData: SourceFileMetaData
		  }
		| {
				error: false
				report: ProjectReport | ModuleReport
				sourceFileMetaData: SourceFileMetaData
				sourceNode: SourceNodeMetaData<SourceNodeMetaDataType_Node>
		  } {
		const sourceNodeIndex = globalIndex.getSourceNodeIndexByID(sourceNodeID)
		if (sourceNodeIndex === undefined) {
			throw new Error(
				'Report.getSourceNodeMetaDataByID: could not resolve source node index from sourceNodeID: ' +
					sourceNodeID.toString()
			)
		}
		const pathIndex = sourceNodeIndex.pathIndex
		if (pathIndex.id === undefined) {
			return {
				error: true
			}
		}
		const moduleIndex = pathIndex.moduleIndex

		const reportToCheck =
			moduleIndex.identifier === '{node}' || this.moduleIndex === moduleIndex
				? (this as unknown as ModuleReport | ProjectReport)
				: this.extern.get(moduleIndex.id as ModuleID_number)

		if (reportToCheck === undefined) {
			return {
				error: true
			}
		}

		if (reportToCheck !== undefined) {
			const sourceFileMetaData = reportToCheck.getSourceFileMetaDataByPathID(
				pathIndex.id
			)
			if (sourceFileMetaData === undefined) {
				return {
					error: true,
					report: reportToCheck
				}
			}
			const sourceNode = sourceFileMetaData.functions.get(sourceNodeID)
			if (sourceNode === undefined) {
				return {
					error: true,
					report: reportToCheck,
					sourceFileMetaData
				}
			}
			return {
				error: false,
				report: reportToCheck,
				sourceFileMetaData,
				sourceNode
			}
		}
		return {
			error: true,
			report: reportToCheck
		}
	}

	getSourceFileMetaDataByPathID(pathID: PathID_number) {
		let sourceFileMetaData = this.lang_internal.get(pathID)
		if (sourceFileMetaData !== undefined) {
			return sourceFileMetaData
		}
		sourceFileMetaData = this.intern.get(pathID)
		if (sourceFileMetaData !== undefined) {
			return sourceFileMetaData
		}
		return undefined
	}

	normalize(newGlobalIndex: GlobalIndex) {
		function sortIDsByPath(
			input: ModelMap<PathID_number, SourceFileMetaData>
		): PathID_number[] {
			return Array.from(input.values())
				.map((value) => ({
					path: value.path,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					id: value.pathIndex.id!
				})) // Pair identifier with id
				.sort((a, b) => a.path.localeCompare(b.path)) // Sort by path
				.map((pair) => pair.id) // Extract sorted ids
		}
		function sortIDsByModuleIdentifier(
			input: ModelMap<ModuleID_number, ModuleReport>
		): ModuleID_number[] {
			return Array.from(input.values())
				.map((value) => ({
					identifier: value.nodeModule.identifier,
					id: value.moduleIndex.id
				})) // Pair identifier with id
				.sort((a, b) => a.identifier.localeCompare(b.identifier)) // Sort by identifier
				.map((pair) => pair.id) // Extract sorted ids
		}

		const new_lang_internal = new ModelMap<PathID_number, SourceFileMetaData>(
			'number'
		)
		for (const pathID of sortIDsByPath(this.lang_internal)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const sourceFileMetaData = this.lang_internal.get(pathID)!
			sourceFileMetaData.normalize(newGlobalIndex)
			if (sourceFileMetaData.pathIndex.id === undefined) {
				throw new Error(
					'Report.normalize(lang_internal): cannot resolve id of new created pathIndex'
				)
			}
			new_lang_internal.set(sourceFileMetaData.pathIndex.id, sourceFileMetaData)
		}
		const newModuleIndex = this.moduleIndex.insertToOtherIndex(newGlobalIndex)
		const new_intern = new ModelMap<PathID_number, SourceFileMetaData>('number')
		for (const pathID of sortIDsByPath(this.intern)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const sourceFileMetaData = this.intern.get(pathID)!
			sourceFileMetaData.normalize(newGlobalIndex)
			if (sourceFileMetaData.pathIndex.id === undefined) {
				throw new Error(
					'Report.normalize(intern): cannot resolve id of new created pathIndex'
				)
			}
			new_intern.set(sourceFileMetaData.pathIndex.id, sourceFileMetaData)
		}
		const new_extern = new ModelMap<ModuleID_number, ModuleReport>('number')
		for (const moduleID of sortIDsByModuleIdentifier(this.extern)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const moduleReport = this.extern.get(moduleID)!
			moduleReport.normalize(newGlobalIndex)
			new_extern.set(moduleReport.moduleIndex.id, moduleReport)
		}
		this.moduleIndex = newModuleIndex
		this._lang_internal = new_lang_internal
		this._intern = new_intern
		this._extern = new_extern
	}

	get headlessSensorValues() {
		if (this._headlessSensorValues === undefined) {
			this._headlessSensorValues = new SensorValues({})
		}
		return this._headlessSensorValues
	}

	set headlessSensorValues(value: SensorValues) {
		this._headlessSensorValues = value
	}

	get lang_internal(): ModelMap<PathID_number, SourceFileMetaData> {
		if (!this._lang_internal) {
			this._lang_internal = new ModelMap<PathID_number, SourceFileMetaData>(
				'number'
			)
		}
		return this._lang_internal
	}

	get intern(): ModelMap<PathID_number, SourceFileMetaData> {
		if (!this._intern) {
			this._intern = new ModelMap<PathID_number, SourceFileMetaData>('number')
		}
		return this._intern
	}

	get extern(): ModelMap<ModuleID_number, ModuleReport> {
		if (!this._extern) {
			this._extern = new ModelMap<ModuleID_number, ModuleReport>('number')
		}
		return this._extern
	}

	getLangInternalPathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : PathIndex | undefined
	>(indexRequestType: T, filePath: LangInternalPath_string) {
		return this.moduleIndex.globalIndex
			.getLangInternalIndex(indexRequestType)
			?.getFilePathIndex(indexRequestType, filePath) as R
	}

	getModuleIndexByID(id: ModuleID_number) {
		return this.moduleIndex.globalIndex.getModuleIndexByID(id)
	}

	getModuleIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? ModuleIndex : ModuleIndex | undefined
	>(indexRequestType: T, moduleIdentifier: NodeModuleIdentifier_string): R {
		return this.moduleIndex.globalIndex.getModuleIndex(
			indexRequestType,
			moduleIdentifier
		) as R
	}

	getPathIndexByID(id: PathID_number) {
		return this.moduleIndex.globalIndex.getPathIndexByID(id)
	}

	getPathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : PathIndex | undefined
	>(indexRequestType: T, filePath: UnifiedPath_string): R {
		return this.moduleIndex.getFilePathIndex(indexRequestType, filePath) as R
	}

	addToLangInternal(
		filePath: LangInternalPath_string,
		functionIdentifier: LangInternalSourceNodeIdentifier_string
	) {
		const pathIndex = this.getLangInternalPathIndex('upsert', filePath)
		const filePathID = pathIndex.id as PathID_number

		// check if filePath is in lang_internal
		let sourceFileMetaData = this.lang_internal.get(filePathID)
		if (!sourceFileMetaData) {
			sourceFileMetaData = new SourceFileMetaData(filePath, pathIndex)
			this.lang_internal.set(filePathID, sourceFileMetaData)
		}
		return sourceFileMetaData.createOrGetSourceNodeMetaData(
			functionIdentifier,
			SourceNodeMetaDataType.LangInternalSourceNode
		)
	}

	addToIntern(
		filePath: UnifiedPath_string,
		functionIdentifier: SourceNodeIdentifier_string
	) {
		const filePathIndex = this.getPathIndex('upsert', filePath)
		const filePathID = filePathIndex.id as PathID_number

		// check if filePath is in intern
		let sourceFileMetaData = this.intern.get(filePathID)
		if (!sourceFileMetaData) {
			sourceFileMetaData = new SourceFileMetaData(filePath, filePathIndex)
			this.intern.set(filePathID, sourceFileMetaData)
		}
		return sourceFileMetaData.createOrGetSourceNodeMetaData(
			functionIdentifier,
			SourceNodeMetaDataType.SourceNode
		)
	}

	addToExtern(
		filePath: UnifiedPath,
		nodeModule: NodeModule,
		functionIdentifier: SourceNodeIdentifier_string
	) {
		const moduleIndex = this.moduleIndex.globalIndex.getModuleIndex(
			'upsert',
			nodeModule.identifier
		)

		// check if filePath is in extern
		let moduleReport = this.extern.get(moduleIndex.id as ModuleID_number)
		if (!moduleReport) {
			moduleReport = new ModuleReport(moduleIndex, nodeModule, this.kind)
			this.extern.set(moduleIndex.id as ModuleID_number, moduleReport)
		}
		const sourceNodeMetaData = moduleReport.addToIntern(
			filePath.toString(),
			functionIdentifier
		)
		return {
			report: moduleReport,
			sourceNodeMetaData: sourceNodeMetaData
		}
	}
	/**
	 * Returns the meta data of a file
	 *
	 * since a meta data file is anonymized (no absolute path is stored)
	 * there is a total of three paths necessary to retrieve the correct meta data of a file
	 *
	 * this.relativeRootDir:
	 * 	describes the location of the execution (relative to the meta data file)
	 *
	 * projectReportFilePath:
	 * 	is the current location of the ProjectReport file
	 *
	 * relativeFilePath:
	 * 	is the location of a measured source file,
	 * 	relative to the execution path (this.relativeRootDir)
	 *
	 * All measurements are stored in this.lang_internal, this,intern and this,extern
	 * the keys are the corresponding relativeFilePaths
	 *
	 * the absolute path of the measured source file is:
	 * path.join(projectReportFilePath, this.relativeRootDir, relativeFilePath)
	 *
	 * therefore the relativeFilePath of the absolute one is:
	 * const relativeFilePath = path.relative(path.join(projectReportFilePath, this.relativeRootDir), absoluteFilePath)
	 *
	 * @param projectReportFilePath is the current location of the ProjectReport file
	 * @param absoluteFilePath is the absolute path of the measured source file
	 * @returns the measurements of the given source file
	 */
	getMetaDataFromFile(
		projectReportFilePath: UnifiedPath,
		absoluteFilePath: UnifiedPath
	): SourceFileMetaData | undefined {
		if (!this.relativeRootDir) {
			const absoluteFilePathIndex = this.getPathIndex(
				'get',
				absoluteFilePath.toString()
			)
			if (absoluteFilePathIndex === undefined) {
				return undefined
			}
			const absoluteFilePathID = absoluteFilePathIndex?.id as PathID_number

			return this.intern.get(absoluteFilePathID)
		}
		const relativeFilePath = projectReportFilePath
			.dirName()
			.join(this.relativeRootDir)
			.pathTo(absoluteFilePath)
		const relativeFilePathIndex = this.getPathIndex(
			'get',
			relativeFilePath.toString()
		)
		if (relativeFilePathIndex === undefined) {
			return undefined
		}
		const relativeFilePathID = relativeFilePathIndex?.id as PathID_number

		return this.intern.get(relativeFilePathID)
	}

	/**
	 * @returns the total sensor values (sum) and the maximum (max) of all measurements in the report
	 */
	totalAndMaxMetaData(): AggregatedSourceNodeMetaData {
		function aggregate(report: Report) {
			const result: SensorValues[] = []

			for (const file of report.intern.values()) {
				for (const func of file.functions.values()) {
					result.push(func.sensorValues)
				}
			}

			for (const file of report.lang_internal.values()) {
				for (const func of file.functions.values()) {
					result.push(func.sensorValues)
				}
			}

			for (const externReport of report.extern.values()) {
				result.push(...aggregate(externReport))
			}

			return result
		}
		const allSensorValues = aggregate(this)

		const totalSensorValues = SensorValues.sum(
			...allSensorValues
		).cloneAsIsolated()
		const maxSensorValues = SensorValues.max(...allSensorValues)

		return new AggregatedSourceNodeMetaData(
			new SourceNodeMetaData(
				SourceNodeMetaDataType.Aggregate,
				undefined,
				totalSensorValues,
				undefined
			),
			new SourceNodeMetaData(
				SourceNodeMetaDataType.Aggregate,
				undefined,
				maxSensorValues,
				undefined
			)
		)
	}

	validate() {
		for (const sourceFileMetaData of this.intern.values()) {
			sourceFileMetaData.validate()
		}
		for (const moduleReport of this.extern.values()) {
			moduleReport.validate()
		}
	}

	toJSON(): IReport {
		if (NODE_ENV === 'test') {
			this.validate()
		}
		return {
			reportVersion: this.reportVersion,
			kind: this.kind,
			relativeRootDir: this.relativeRootDir?.toJSON(),
			headlessSensorValues: this.headlessSensorValues.toJSON(),
			lang_internal: this.lang_internal.toJSON<ISourceFileMetaData>(),
			intern: this.intern.toJSON<ISourceFileMetaData>(),
			extern: this.extern.toJSON<IModuleReport>()
		}
	}

	static fromJSONReport(
		json: string | IReport,
		moduleIndex: ModuleIndex
	): Report {
		let data: IReport
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new Report(moduleIndex, data.kind)

		if (data.lang_internal) {
			for (const key of Object.keys(data.lang_internal)) {
				const keyNumber = parseInt(key) as PathID_number
				const pathIndex = result.getPathIndexByID(keyNumber)
				if (pathIndex === undefined) {
					throw new Error(
						`Report.fromJSONReport: (lang_internal) could not resolve path index from id: ${keyNumber}`
					)
				}

				result.lang_internal.set(
					keyNumber,
					SourceFileMetaData.fromJSON(data.lang_internal[keyNumber], pathIndex)
				)
			}
		}

		if (data.headlessSensorValues) {
			result.headlessSensorValues = SensorValues.fromJSON(
				data.headlessSensorValues
			)
		}

		if (data.intern) {
			for (const key of Object.keys(data.intern)) {
				const keyNumber = parseInt(key) as PathID_number
				const pathIndex = result.getPathIndexByID(keyNumber)
				if (pathIndex === undefined) {
					throw new Error(
						`Report.fromJSONReport: (intern) could not resolve path index from id: ${keyNumber}`
					)
				}

				result.intern.set(
					keyNumber,
					SourceFileMetaData.fromJSON(data.intern[keyNumber], pathIndex)
				)
			}
		}

		if (data.extern) {
			for (const key of Object.keys(data.extern)) {
				const keyNumber = parseInt(key) as ModuleID_number
				const nodeModule = NodeModule.fromJSON(
					data.extern[keyNumber].nodeModule
				)

				const nextModuleIndex = moduleIndex.globalIndex.getModuleIndex(
					'upsert',
					nodeModule.identifier
				)

				result.extern.set(
					keyNumber,
					ModuleReport.fromJSON(data.extern[keyNumber], nextModuleIndex)
				)
			}
		}
		if (data.relativeRootDir) {
			result.relativeRootDir = new UnifiedPath(
				data.relativeRootDir as unknown as string
			)
		}
		result.reportVersion = data.reportVersion

		return result
	}

	storeToFileReport(
		filePath: UnifiedPath,
		kind: 'pretty-json' | 'json' | 'bin',
		type: ReportType,
		config?: ProfilerConfig
	) {
		if (!this.relativeRootDir) {
			const usedConfig =
				config !== undefined ? config : ProfilerConfig.autoResolve()
			this.relativeRootDir = filePath.dirName().pathTo(usedConfig.getRootDir())
		}

		switch (kind) {
			case 'pretty-json':
				PermissionHelper.writeFileWithUserPermission(
					filePath,
					JSON.stringify(this, null, 2)
				)
				break
			case 'json':
				PermissionHelper.writeFileWithUserPermission(
					filePath,
					JSON.stringify(this)
				)
				break
			case 'bin':
				PermissionHelper.writeFileWithUserPermission(
					filePath,
					this.toBuffer(type)
				)
				break
			default:
				break
		}
	}

	static merge(
		moduleIndex: ModuleIndex,
		...args: (ProjectReport | ModuleReport)[]
	): Report {
		if (args.length === 0) {
			throw new Error('Report.merge: no Reports were given')
		}
		const result = new Report(moduleIndex, ReportKind.accumulated)

		const version = args[0].reportVersion
		result.reportVersion = version

		const headlessSensorValues: SensorValues[] = []
		const valuesToMerge: {
			lang_internal: Record<LangInternalPath_string, SourceFileMetaData[]>
			intern: Record<UnifiedPath_string, SourceFileMetaData[]>
			extern: Record<NodeModuleIdentifier_string, ModuleReport[]>
		} = {
			lang_internal: {},
			intern: {},
			extern: {}
		}

		for (const currentProjectReport of args) {
			if (currentProjectReport.reportVersion !== version) {
				throw new Error(
					'ProjectReport.merge: Project reports versions are not compatible'
				)
			}
			headlessSensorValues.push(currentProjectReport.headlessSensorValues)

			for (const [
				langInternalPathID,
				sourceFileMetaData
			] of currentProjectReport.lang_internal.entries()) {
				const langInternalPathIndex =
					currentProjectReport.getPathIndexByID(langInternalPathID)

				if (langInternalPathIndex === undefined) {
					throw new Error(
						'Report.merge: (lang_internal) could not resolve langInternalPath from id'
					)
				}
				const langInternalPath =
					langInternalPathIndex.identifier as LangInternalPath_string

				if (!valuesToMerge.lang_internal[langInternalPath]) {
					valuesToMerge.lang_internal[langInternalPath] = []
				}
				valuesToMerge.lang_internal[langInternalPath].push(sourceFileMetaData)
			}

			for (const [
				sourceFilePathID,
				sourceFileMetaData
			] of currentProjectReport.intern.entries()) {
				const sourceFilePathIndex =
					currentProjectReport.getPathIndexByID(sourceFilePathID)

				if (sourceFilePathIndex === undefined) {
					throw new Error(
						'Report.merge: (intern) could not resolve sourceFilePath from id'
					)
				}
				const sourceFilePath =
					sourceFilePathIndex.identifier as UnifiedPath_string

				if (!valuesToMerge.intern[sourceFilePath]) {
					valuesToMerge.intern[sourceFilePath] = []
				}
				valuesToMerge.intern[sourceFilePath].push(sourceFileMetaData)
			}

			for (const [
				moduleID,
				moduleReport
			] of currentProjectReport.extern.entries()) {
				const nodeModuleIndex =
					currentProjectReport.getModuleIndexByID(moduleID)

				if (nodeModuleIndex === undefined) {
					throw new Error(
						'Report.merge: (intern) could not resolve nodeModuleIdentifier from id'
					)
				}
				const nodeModuleIdentifier =
					nodeModuleIndex.identifier as NodeModuleIdentifier_string

				if (!valuesToMerge.extern[nodeModuleIdentifier]) {
					valuesToMerge.extern[nodeModuleIdentifier] = []
				}
				valuesToMerge.extern[nodeModuleIdentifier].push(moduleReport)
			}
		}

		for (const [langInternalPath, sourceFileMetaDatas] of Object.entries(
			valuesToMerge.lang_internal
		)) {
			const langInternalPathIndex = result.getLangInternalPathIndex(
				'upsert',
				langInternalPath as LangInternalPath_string
			)
			const langInternalPathID = langInternalPathIndex.id as PathID_number

			result.lang_internal.set(
				langInternalPathID,
				SourceFileMetaData.merge(langInternalPathIndex, ...sourceFileMetaDatas)
			)
		}

		for (const [sourceFilePath, sourceFileMetaDatas] of Object.entries(
			valuesToMerge.intern
		)) {
			const sourceFilePathIndex = result.getPathIndex(
				'upsert',
				sourceFilePath as UnifiedPath_string
			)
			const sourceFilePathID = sourceFilePathIndex.id as PathID_number

			result.intern.set(
				sourceFilePathID,
				SourceFileMetaData.merge(sourceFilePathIndex, ...sourceFileMetaDatas)
			)
		}

		for (const [nodeModuleIdentifier, moduleReports] of Object.entries(
			valuesToMerge.extern
		)) {
			const nodeModuleIndex = result.getModuleIndex(
				'upsert',
				nodeModuleIdentifier as NodeModuleIdentifier_string
			)
			const nodeModuleID = nodeModuleIndex.id as ModuleID_number

			result.extern.set(
				nodeModuleID,
				ModuleReport.merge(nodeModuleIndex, ...moduleReports)
			)
		}
		result.headlessSensorValues = SensorValues.sum(...headlessSensorValues)

		return result
	}

	toBuffer(type: ReportType): Buffer {
		const buffers = [
			BufferHelper.String2LToBuffer(this.reportVersion),
			BufferHelper.UInt8ToBuffer(this.kind),
			BufferHelper.UInt8ToBuffer(type),
			BufferHelper.BooleanToBuffer(this.relativeRootDir !== undefined)
		]
		if (this.relativeRootDir !== undefined) {
			buffers.push(
				BufferHelper.String2LToBuffer(this.relativeRootDir.toString())
			)
		}
		// if current Oaklean version is greater or equal to 0.1.4
		// add lang_internal_headless_cpu_time to the buffer
		if (VersionHelper.compare(this.reportVersion, '0.1.4') >= 0) {
			buffers.push(this.headlessSensorValues.toBuffer())
		}

		buffers.push(
			this.intern.toBuffer(),
			this.lang_internal.toBuffer(),
			this.extern.toBuffer()
		)

		return Buffer.concat(buffers)
	}

	static consumeFromBufferReport(
		buffer: Buffer,
		moduleIndex: ModuleIndex
	): { instance: Report; type: ReportType; remainingBuffer: Buffer } {
		let remainingBuffer = buffer
		const { instance: reportVersion, remainingBuffer: newRemainingBuffer0 } =
			BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		const { instance: kind, remainingBuffer: newRemainingBuffer1 } =
			BufferHelper.UInt8FromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1

		const { instance: type, remainingBuffer: newRemainingBuffer2 } =
			BufferHelper.UInt8FromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2

		const {
			instance: relativeRootDirPresent,
			remainingBuffer: newRemainingBuffer3
		} = BufferHelper.BooleanFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer3

		let relativeRootDir = undefined
		if (relativeRootDirPresent) {
			const { instance, remainingBuffer: newRemainingBuffer3 } =
				BufferHelper.String2LFromBuffer(remainingBuffer)
			relativeRootDir = instance
			remainingBuffer = newRemainingBuffer3
		}

		let headlessSensorValues: SensorValues | undefined = undefined
		// if the version of the Report is greater or equal to 0.1.4
		// consume lang_internal_headless_cpu_time from the buffer
		if (VersionHelper.compare(reportVersion, '0.1.4') >= 0) {
			const {
				instance: headlessSensorValues_instance,
				remainingBuffer: newRemainingBuffer3_1
			} = SensorValues.consumeFromBuffer(remainingBuffer)
			remainingBuffer = newRemainingBuffer3_1
			headlessSensorValues = headlessSensorValues_instance
		}

		// if the version of the Report is less or equal to 0.1.4
		// consume internMapping from the buffer and ignore it (since it is not used anymore)
		if (VersionHelper.compare(reportVersion, '0.1.4') <= 0) {
			const {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				instance: internMapping,
				remainingBuffer: newRemainingBuffer4
			} = ModelMap.consumeFromBuffer<PathID_number, PathID_number>(
				remainingBuffer,
				'number',
				'number'
			)
			remainingBuffer = newRemainingBuffer4
		}

		const consumeFromBuffer_SourceFileMetaData = (buffer: Buffer) => {
			return SourceFileMetaData.consumeFromBuffer(
				buffer,
				moduleIndex.globalIndex
			)
		}
		const { instance: intern, remainingBuffer: newRemainingBuffer5 } =
			ModelMap.consumeFromBuffer<PathID_number, SourceFileMetaData>(
				remainingBuffer,
				'number',
				consumeFromBuffer_SourceFileMetaData
			)
		remainingBuffer = newRemainingBuffer5

		const { instance: lang_internal, remainingBuffer: newRemainingBuffer6 } =
			ModelMap.consumeFromBuffer<PathID_number, SourceFileMetaData>(
				remainingBuffer,
				'number',
				consumeFromBuffer_SourceFileMetaData
			)
		remainingBuffer = newRemainingBuffer6

		const consumeFromBuffer_ModuleReport = (buffer: Buffer) => {
			return ModuleReport.consumeFromBuffer_ModuleReport(
				buffer,
				moduleIndex.globalIndex
			)
		}

		const { instance: extern, remainingBuffer: newRemainingBuffer7 } =
			ModelMap.consumeFromBuffer<ModuleID_number, ModuleReport>(
				remainingBuffer,
				'number',
				consumeFromBuffer_ModuleReport
			)
		remainingBuffer = newRemainingBuffer7

		const result = new Report(moduleIndex, kind)
		result.reportVersion = reportVersion
		result.relativeRootDir =
			relativeRootDir !== undefined
				? new UnifiedPath(relativeRootDir)
				: undefined
		result._intern = intern
		result._lang_internal = lang_internal
		result._extern = extern
		if (headlessSensorValues) {
			result.headlessSensorValues = headlessSensorValues
		}

		return {
			instance: result,
			type,
			remainingBuffer
		}
	}
}
// eslint-disable-next-line import/order
import { ModuleReport } from './ModuleReport'
// eslint-disable-next-line import/order
import { ProjectReport } from './ProjectReport'
