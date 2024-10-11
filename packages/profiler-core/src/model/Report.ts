import * as fs from 'fs'

import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import { NodeModule } from './NodeModule'
import {
	SourceFileMetaData,
	AggregatedSourceNodeMetaData
} from './SourceFileMetaData'
import {
	SourceNodeMetaData
} from './SourceNodeMetaData'
import { ProfilerConfig } from './ProfilerConfig'
import { ModuleIndex } from './index/ModuleIndex'
import { GlobalIndex } from './index/GlobalIndex'
import { PathIndex } from './index/PathIndex'

import { PermissionHelper } from '../helper/PermissionHelper'
import { VERSION } from '../constants/app'
import { UnifiedPath } from '../system/UnifiedPath'
import { BufferHelper } from '../helper/BufferHelper'
// Types
import {
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string,
	SourceNodeIdentifier_string,
	UnifiedPath_string,
	SourceNodeMetaDataType,
	ReportKind,
	NodeModuleIdentifier_string,
	IPureCPUTime,
	IPureCPUEnergyConsumption,
	IPureRAMEnergyConsumption,
	ModuleID_number,
	IndexRequestType,
	PathID_number,
	IReport,
	ReportType,
	ISourceFileMetaData
} from '../types'


// global variable to assign an intern id to every report
// the intern id is only used to uniquely identify a report within a project report,
// since there could be multiple module reports for the same node module (but as a child of another module report)
let currentInternID = 0

export class Report extends BaseModel {
	reportVersion: string
	kind: ReportKind
	relativeRootDir?: UnifiedPath
	private _internMapping?: ModelMap<PathID_number, PathID_number>
	private _lang_internal?: ModelMap<PathID_number, SourceFileMetaData>
	private _intern?: ModelMap<PathID_number, SourceFileMetaData>
	private _extern?: ModelMap<ModuleID_number, ModuleReport>
	
	// counts internIDs for all reports (is only stored on the root report)
	internID: number

	// the part of the index that represents this report
	moduleIndex: ModuleIndex

	constructor(
		moduleIndex: ModuleIndex,
		kind: ReportKind
	) {
		super()
		this.reportVersion = VERSION
		this.kind = kind
		this.moduleIndex = moduleIndex
		this.internID = currentInternID++
	}

	normalize(
		newGlobalIndex: GlobalIndex
	) {
		const new_lang_internal = new ModelMap<PathID_number, SourceFileMetaData>('number')
		for (const pathID of Array.from(this.lang_internal.keys()).sort()) {
			const sourceFileMetaData = this.lang_internal.get(pathID)!
			sourceFileMetaData.normalize(newGlobalIndex)
			if (sourceFileMetaData.pathIndex.id === undefined) {
				throw new Error('Report.normalize(lang_internal): cannot resolve id of new created pathIndex')
			}
			new_lang_internal.set(sourceFileMetaData.pathIndex.id, sourceFileMetaData)
		}
		const newModuleIndex = this.moduleIndex.insertToOtherIndex(newGlobalIndex)
		const new_intern = new ModelMap<PathID_number, SourceFileMetaData>('number')
		for (const pathID of Array.from(this.intern.keys()).sort()) {
			const sourceFileMetaData = this.intern.get(pathID)!
			sourceFileMetaData.normalize(newGlobalIndex)
			if (sourceFileMetaData.pathIndex.id === undefined) {
				throw new Error('Report.normalize(intern): cannot resolve id of new created pathIndex')
			}
			new_intern.set(sourceFileMetaData.pathIndex.id, sourceFileMetaData)
		}
		const new_extern = new ModelMap<ModuleID_number, ModuleReport>('number')
		for (const moduleID of Array.from(this.extern.keys()).sort()) {
			const moduleReport = this.extern.get(moduleID)!
			moduleReport.normalize(newGlobalIndex)
			new_extern.set(moduleReport.moduleIndex.id, moduleReport)
		}
		const newInternMapping = new ModelMap<PathID_number, PathID_number>('number')
		for (const PathID_source of Array.from(this.internMapping.keys()).sort()) {
			const PathID_target = this.internMapping.get(PathID_source)!

			const pathIndex_source = this.moduleIndex.globalIndex.getPathIndexByID(PathID_source)
			const pathIndex_target = this.moduleIndex.globalIndex.getPathIndexByID(PathID_target)
			if (pathIndex_source === undefined || pathIndex_target === undefined) {
				throw new Error('Report.normalize(internMapping): could not resolve path index')
			}
			const newModuleIndex_source = newGlobalIndex.getModuleIndex('get')
			const newModuleIndex_target = newGlobalIndex.getModuleIndex('get')
			if (newModuleIndex_source === undefined || newModuleIndex_target === undefined) {
				throw new Error('Report.normalize(internMapping): could not resolve new module index')
			}
			const newPathIndex_source_id = newModuleIndex_source.getFilePathIndex('upsert', pathIndex_source.identifier).id
			const newPathIndex_target_id = newModuleIndex_target.getFilePathIndex('get', pathIndex_target.identifier)?.id
			if (newPathIndex_source_id === undefined || newPathIndex_target_id === undefined) {
				throw new Error('Report.normalize(internMapping): could not resolve new path index')
			}
			newInternMapping.set(newPathIndex_source_id, newPathIndex_target_id)
		}
		this.moduleIndex = newModuleIndex
		this._internMapping = newInternMapping
		this._lang_internal = new_lang_internal
		this._intern = new_intern
		this._extern = new_extern
	}

	get internMapping(): ModelMap<PathID_number, PathID_number> {
		if (!this._internMapping) {
			this._internMapping = new ModelMap<PathID_number, PathID_number>('number')
		}
		return this._internMapping
	}

	get lang_internal(): ModelMap<PathID_number, SourceFileMetaData> {
		if (!this._lang_internal) {
			this._lang_internal = new ModelMap<PathID_number, SourceFileMetaData>('number')
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

	get reversedInternMapping(): ModelMap<PathID_number, PathID_number> {
		const result = new ModelMap<PathID_number, PathID_number>('number')
		for (const [key, value] of this.internMapping.entries()) {
			result.set(value, key)
		}
		return result
	}

	getLangInternalPathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : PathIndex | undefined
	>(
		indexRequestType: T,
		filePath: LangInternalPath_string
	) {
		return this.
			moduleIndex.
			globalIndex.
			getLangInternalIndex(indexRequestType)?.
			getFilePathIndex(indexRequestType, filePath) as R
	}

	getModuleIndexByID(id: ModuleID_number) {
		return this.moduleIndex.globalIndex.getModuleIndexByID(id)
	}

	getModuleIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? ModuleIndex : ModuleIndex | undefined
	>(
		indexRequestType: T,
		moduleIdentifier: NodeModuleIdentifier_string
	): R {
		return this.moduleIndex.
			globalIndex.
			getModuleIndex(indexRequestType, moduleIdentifier) as R
	}

	getPathIndexByID(id: PathID_number) {
		return this.moduleIndex.globalIndex.getPathIndexByID(id)
	}

	getPathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : PathIndex | undefined
	>(
		indexRequestType: T,
		filePath: UnifiedPath_string
	): R {
		return this.moduleIndex.getFilePathIndex(indexRequestType, filePath) as R
	}

	removeFromIntern(filePath: UnifiedPath_string | UnifiedPath_string[]) {
		let filePaths: UnifiedPath_string[] = []
		if (typeof filePath === 'string') {
			filePaths = [filePath]
		} else {
			filePaths = filePath
		}
		for (const pathToRemove of filePaths) {
			const pathIndex = this.getPathIndex('get', pathToRemove)
			if (pathIndex === undefined) {
				continue
			}
			const pathID = pathIndex.id as PathID_number
			if (this.intern.has(pathID)) {
				this.intern.delete(pathID)
			}
			if (this.internMapping.has(pathID)) {
				this.internMapping.delete(pathID)
			}
		}
		for (const sourceFileMetaData of this.intern.values()) {
			sourceFileMetaData.removeFromIntern(filePaths)
		}
	}

	addSourceFileMapLink(
		compiledFilePath: UnifiedPath,
		sourceFilePath: UnifiedPath,
	) {
		const compiledFilePathIndex = this.getPathIndex('get', compiledFilePath.toString())
		const compiledFilePathID = compiledFilePathIndex?.id as PathID_number

		if (compiledFilePathID === undefined || !this.intern.has(compiledFilePathID)) {
			throw new Error(
				`addSourceFileMapLink: The compiled file target does not exist (${compiledFilePath.toString()})`
			)
		}
		const sourceFilePathIndex = this.getPathIndex('upsert', sourceFilePath.toString())
		const sourceFilePathID = sourceFilePathIndex.id as PathID_number
		this.internMapping.set(sourceFilePathID, compiledFilePathID)
	}

	addToLangInternal(
		filePath: LangInternalPath_string,
		functionIdentifier: LangInternalSourceNodeIdentifier_string,
	) {
		const pathIndex = this.getLangInternalPathIndex('upsert', filePath)
		const filePathID = pathIndex.id as PathID_number

		// check if filePath is in intern
		let sourceFileMetaData = this.lang_internal.get(filePathID)
		if (!sourceFileMetaData) {
			sourceFileMetaData = new SourceFileMetaData(
				filePath,
				pathIndex
			)
			this.lang_internal.set(filePathID, sourceFileMetaData)
		}
		return sourceFileMetaData.createOrGetSourceNodeMetaData(
			functionIdentifier,
			SourceNodeMetaDataType.LangInternalSourceNode
		)
	}

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToLangInternal(
		filePath: LangInternalPath_string,
		functionIdentifier: LangInternalSourceNodeIdentifier_string,
		{
			cpuTime,
			cpuEnergyConsumption,
			ramEnergyConsumption
		}: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption
		}
	): SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNode> {
		const sourceNodeMetaData = this.addToLangInternal(
			filePath,
			functionIdentifier
		)
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({ cpuTime, cpuEnergyConsumption, ramEnergyConsumption })
		return sourceNodeMetaData
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
			sourceFileMetaData = new SourceFileMetaData(
				filePath,
				filePathIndex
			)
			this.intern.set(filePathID, sourceFileMetaData)
		}
		return sourceFileMetaData.createOrGetSourceNodeMetaData(
			functionIdentifier,
			SourceNodeMetaDataType.SourceNode
		)
	}

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToIntern(
		filePath: UnifiedPath_string,
		functionIdentifier: SourceNodeIdentifier_string,
		{
			cpuTime,
			cpuEnergyConsumption,
			ramEnergyConsumption
		}: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption
		}
	): SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> {
		const sourceNodeMetaData = this.addToIntern(
			filePath,
			functionIdentifier
		)
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({ cpuTime, cpuEnergyConsumption, ramEnergyConsumption })
		return sourceNodeMetaData
	}

	addToExtern(
		filePath: UnifiedPath,
		nodeModule: NodeModule,
		functionIdentifier: SourceNodeIdentifier_string
	) {
		const moduleIndex = this.moduleIndex.globalIndex.getModuleIndex('upsert', nodeModule.identifier)

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

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToExtern(
		filePath: UnifiedPath,
		nodeModule: NodeModule,
		functionIdentifier: SourceNodeIdentifier_string,
		{
			cpuTime,
			cpuEnergyConsumption,
			ramEnergyConsumption
		}: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption
			ramEnergyConsumption: IPureRAMEnergyConsumption
		}
	): {
			report: ModuleReport,
			sourceNodeMetaData: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
		} {
		const {
			report,
			sourceNodeMetaData
		} = this.addToExtern(
			filePath,
			nodeModule,
			functionIdentifier,
		)
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({ cpuTime, cpuEnergyConsumption, ramEnergyConsumption })
		return {
			report,
			sourceNodeMetaData
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
			const absoluteFilePathIndex = this.getPathIndex('get', absoluteFilePath.toString())
			if (absoluteFilePathIndex === undefined) {
				return undefined
			}
			const absoluteFilePathID = absoluteFilePathIndex?.id as PathID_number

			const internResult = this.intern.get(absoluteFilePathID)
			if (internResult) {
				return internResult
			}
			const mappedabsoluteFilePathID = this.internMapping.get(absoluteFilePathID)
			if (mappedabsoluteFilePathID) {
				return this.intern.get(mappedabsoluteFilePathID)
			}
			return undefined
		}
		const relativeFilePath =
			projectReportFilePath.dirName().join(this.relativeRootDir).pathTo(
				absoluteFilePath
			)
		const relativeFilePathIndex = this.getPathIndex('get', relativeFilePath.toString())
		if (relativeFilePathIndex === undefined) {
			return undefined
		}
		const relativeFilePathID = relativeFilePathIndex?.id as PathID_number
		const internResult = this.intern.get(relativeFilePathID)
		if (internResult) {
			return internResult
		}
		const mappedRelativeFilePathID = this.internMapping.get(relativeFilePathID)
		if (mappedRelativeFilePathID) {
			return this.intern.get(mappedRelativeFilePathID)
		}
		return undefined
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
		if (process.env.NODE_ENV === 'test') {
			this.validate()
		}
		return {
			reportVersion: this.reportVersion,
			kind: this.kind,
			relativeRootDir: this.relativeRootDir?.toJSON(),
			internMapping: this.internMapping.toJSON(),
			lang_internal: this.lang_internal.toJSON<ISourceFileMetaData>(),
			intern: this.intern.toJSON<ISourceFileMetaData>(),
			extern: this.extern.toJSON<IModuleReport>(),
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

		if (data.internMapping) {
			for (const key of Object.keys(data.internMapping)) {
				const keyNumber = parseInt(key)
				result.internMapping.set(
					keyNumber as PathID_number,
					data.internMapping[keyNumber as PathID_number]
				)
			}
		}

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
					SourceFileMetaData.fromJSON(
						data.lang_internal[keyNumber],
						pathIndex
					)
				)
			}
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
					SourceFileMetaData.fromJSON(
						data.intern[keyNumber],
						pathIndex
					)
				)
			}
		}

		if (data.extern) {
			for (const key of Object.keys(data.extern)) {
				const keyNumber = parseInt(key) as ModuleID_number
				const nodeModule = NodeModule.fromJSON(data.extern[keyNumber].nodeModule)

				const nextModuleIndex = moduleIndex.globalIndex.getModuleIndex(
					'upsert',
					nodeModule.identifier
				)
				
				result.extern.set(
					keyNumber,
					ModuleReport.fromJSON(
						data.extern[keyNumber],
						nextModuleIndex
					)
				)
			}
		}
		if (data.relativeRootDir) {
			result.relativeRootDir = new UnifiedPath(data.relativeRootDir as unknown as string)
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
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(filePath.dirName().toPlatformString())
		}
		if (!this.relativeRootDir) {
			const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()
			this.relativeRootDir = filePath.dirName().pathTo(usedConfig.getRootDir())
		}

		switch (kind) {
			case 'pretty-json':
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					JSON.stringify(this, null, 2)
				)
				break
			case 'json':
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					JSON.stringify(this)
				)
				break
			case 'bin':
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					this.toBuffer(type)
				)
				break
			default:
				break
		}
		
	}

	static merge(
		moduleIndex: ModuleIndex,
		...args: Report[]
	): Report {
		if (args.length === 0) {
			throw new Error('Report.merge: no Reports were given')
		}
		const result = new Report(moduleIndex, ReportKind.accumulated)

		const version = args[0].reportVersion
		result.reportVersion = version

		const valuesToMerge: {
			lang_internal: Record<LangInternalPath_string, SourceFileMetaData[]>,
			intern: Record<UnifiedPath_string, SourceFileMetaData[]>,
			extern: Record<NodeModuleIdentifier_string, ModuleReport[]>
		} = {
			lang_internal: {},
			intern: {},
			extern: {},
		}

		for (const currentProjectReport of args) {
			if (currentProjectReport.reportVersion !== version) {
				throw new Error('ProjectReport.merge: Project reports versions are not compatible')
			}
			for (const [pathID, mappedPathID] of currentProjectReport.internMapping.entries()) {
				// extract paths from the given IDs
				const pathIndex = currentProjectReport.getPathIndexByID(pathID)
				const mappedPathIndex = currentProjectReport.getPathIndexByID(mappedPathID)

				if (pathIndex === undefined || mappedPathIndex === undefined) {
					throw new Error('Report.merge: (internMapping) could not resolve paths from ids')
				}
				
				// add old pathID to new index and get its newPathID
				const newPathID = result.getPathIndex(
					'upsert',
					pathIndex.identifier as UnifiedPath_string
				).id as PathID_number

				const resultValue = result.internMapping.get(newPathID)
				if (!resultValue) {
					// add old MappedPathID to new index and get its newMappedPathID
					const newMappedPathID = result.getPathIndex(
						'upsert',
						mappedPathIndex.identifier as UnifiedPath_string
					).id as PathID_number
					result.internMapping.set(newPathID, newMappedPathID)
				} else {
					if (result.getPathIndexByID(resultValue)?.identifier !== mappedPathIndex.identifier) {
						throw new Error('ProjectReport.merge: the ProjectReports contain different path mapping')
					}
				}
			}

			for (const [langInternalPathID, sourceFileMetaData] of currentProjectReport.lang_internal.entries()) {
				const langInternalPathIndex = currentProjectReport.getPathIndexByID(langInternalPathID)

				if (langInternalPathIndex === undefined) {
					throw new Error('Report.merge: (lang_internal) could not resolve langInternalPath from id')
				}
				const langInternalPath = langInternalPathIndex.identifier as LangInternalPath_string

				if (!valuesToMerge.lang_internal[langInternalPath]) {
					valuesToMerge.lang_internal[langInternalPath] = []
				}
				valuesToMerge.lang_internal[langInternalPath].push(sourceFileMetaData)
			}

			for (const [sourceFilePathID, sourceFileMetaData] of currentProjectReport.intern.entries()) {
				const sourceFilePathIndex = currentProjectReport.getPathIndexByID(sourceFilePathID)
				
				if (sourceFilePathIndex === undefined) {
					throw new Error('Report.merge: (intern) could not resolve sourceFilePath from id')
				}
				const sourceFilePath = sourceFilePathIndex.identifier as UnifiedPath_string

				if (!valuesToMerge.intern[sourceFilePath]) {
					valuesToMerge.intern[sourceFilePath] = []
				}
				valuesToMerge.intern[sourceFilePath].push(sourceFileMetaData)
			}

			for (const [moduleID, moduleReport] of currentProjectReport.extern.entries()) {
				const nodeModuleIndex = currentProjectReport.getModuleIndexByID(moduleID)

				if (nodeModuleIndex === undefined) {
					throw new Error('Report.merge: (intern) could not resolve nodeModuleIdentifier from id')
				}
				const nodeModuleIdentifier = nodeModuleIndex.identifier as NodeModuleIdentifier_string

				if (!valuesToMerge.extern[nodeModuleIdentifier]) {
					valuesToMerge.extern[nodeModuleIdentifier] = []
				}
				valuesToMerge.extern[nodeModuleIdentifier].push(moduleReport)
			}
		}

		for (const [langInternalPath, sourceFileMetaDatas] of Object.entries(valuesToMerge.lang_internal)) {
			const langInternalPathIndex = result.
				getLangInternalPathIndex(
					'upsert', langInternalPath as LangInternalPath_string
				)
			const langInternalPathID = langInternalPathIndex.id as PathID_number

			result.lang_internal.set(
				langInternalPathID,
				SourceFileMetaData.merge(langInternalPathIndex, ...sourceFileMetaDatas)
			)
		}

		for (const [sourceFilePath, sourceFileMetaDatas] of Object.entries(valuesToMerge.intern)) {
			const sourceFilePathIndex = result.getPathIndex('upsert', sourceFilePath as UnifiedPath_string)
			const sourceFilePathID = sourceFilePathIndex.id as PathID_number

			result.intern.set(
				sourceFilePathID,
				SourceFileMetaData.merge(sourceFilePathIndex, ...sourceFileMetaDatas)
			)
		}

		for (const [nodeModuleIdentifier, moduleReports] of Object.entries(valuesToMerge.extern)) {
			const nodeModuleIndex = result.getModuleIndex('upsert', nodeModuleIdentifier as NodeModuleIdentifier_string)
			const nodeModuleID = nodeModuleIndex.id as ModuleID_number

			result.extern.set(
				nodeModuleID,
				ModuleReport.merge(nodeModuleIndex, ...moduleReports)
			)
		}

		return result
	}

	toBuffer(
		type: ReportType
	): Buffer {
		const buffers = [
			BufferHelper.String2LToBuffer(this.reportVersion),
			BufferHelper.UInt8ToBuffer(this.kind),
			BufferHelper.UInt8ToBuffer(type),
			BufferHelper.BooleanToBuffer(this.relativeRootDir !== undefined)
		]
		if (this.relativeRootDir !== undefined) {
			buffers.push(BufferHelper.String2LToBuffer(this.relativeRootDir.toString()))
		}
		buffers.push(
			this.internMapping.toBuffer(),
			this.intern.toBuffer(),
			this.lang_internal.toBuffer(),
			this.extern.toBuffer()
		)
		
		return Buffer.concat(buffers)
	}

	static consumeFromBufferReport(
		buffer: Buffer,
		moduleIndex: ModuleIndex
	): { instance: Report, type: ReportType, remainingBuffer: Buffer } {
		let remainingBuffer = buffer
		const {
			instance: reportVersion,
			remainingBuffer: newRemainingBuffer0
		} = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer0

		const {
			instance: kind,
			remainingBuffer: newRemainingBuffer1
		} = BufferHelper.UInt8FromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1

		const {
			instance: type,
			remainingBuffer: newRemainingBuffer2
		} = BufferHelper.UInt8FromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2

		const {
			instance: relativeRootDirPresent,
			remainingBuffer: newRemainingBuffer3
		} = BufferHelper.BooleanFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer3

		let relativeRootDir = undefined
		if (relativeRootDirPresent) {
			const {
				instance,
				remainingBuffer: newRemainingBuffer3
			} = BufferHelper.String2LFromBuffer(remainingBuffer)
			relativeRootDir = instance
			remainingBuffer = newRemainingBuffer3
		}

		const {
			instance: internMapping,
			remainingBuffer: newRemainingBuffer4
		} = ModelMap.consumeFromBuffer<PathID_number, PathID_number>(
			remainingBuffer,
			'number',
			'number'
		)
		remainingBuffer = newRemainingBuffer4

		const consumeFromBuffer_SourceFileMetaData = (buffer: Buffer) => {
			return SourceFileMetaData.consumeFromBuffer(buffer, moduleIndex.globalIndex)
		}
		const {
			instance: intern,
			remainingBuffer: newRemainingBuffer5
		} = ModelMap.consumeFromBuffer<PathID_number, SourceFileMetaData>(
			remainingBuffer,
			'number',
			consumeFromBuffer_SourceFileMetaData
		)
		remainingBuffer = newRemainingBuffer5

		const {
			instance: lang_internal,
			remainingBuffer: newRemainingBuffer6
		} = ModelMap.consumeFromBuffer<PathID_number, SourceFileMetaData>(
			remainingBuffer,
			'number',
			consumeFromBuffer_SourceFileMetaData
		)
		remainingBuffer = newRemainingBuffer6

		const consumeFromBuffer_ModuleReport = (buffer: Buffer) => {
			return ModuleReport.consumeFromBuffer_ModuleReport(buffer, moduleIndex.globalIndex)
		}

		const {
			instance: extern,
			remainingBuffer: newRemainingBuffer7
		} = ModelMap.consumeFromBuffer<ModuleID_number, ModuleReport>(
			remainingBuffer,
			'number',
			consumeFromBuffer_ModuleReport
		)
		remainingBuffer = newRemainingBuffer7
		

		const result = new Report(moduleIndex, kind)
		result.reportVersion = reportVersion
		result.relativeRootDir = relativeRootDir !== undefined ? new UnifiedPath(relativeRootDir) : undefined
		result._internMapping = internMapping
		result._intern = intern
		result._lang_internal = lang_internal
		result._extern = extern

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
import {
	IModuleReport
} from '../types'