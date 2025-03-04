import * as fs from 'fs'

import globToRegExp from 'glob-to-regexp'

import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import {
	SourceFileMetaData,
	AggregatedSourceNodeMetaData,
} from './SourceFileMetaData'
import { SourceNodeMetaData } from './SourceNodeMetaData'
import { Report } from './Report'
import { ProjectReport } from './ProjectReport'
import { ModuleReport } from './ModuleReport'
import { NodeModule } from './NodeModule'
import { SensorValues } from './SensorValues'
import { PathIndex } from './indices/PathIndex'
import { GlobalIndex } from './indices/GlobalIndex'
import { ModuleIndex } from './indices/ModuleIndex'

import { UnifiedPath } from '../system/UnifiedPath'
import { PermissionHelper } from '../helper/PermissionHelper'
// Types
import {
	LangInternalPath_string,
	SourceNodeMetaDataType,
	SourceFileMetaDataTreeType,
	UnifiedPath_stringOnlyForPathNode,
	IGlobalIndexOnlyForRootNode,
	IEngineModuleOnlyForRootNode,
	ISourceFileMetaDataTree,
	NodeModuleIdentifier_string,
	PathID_number,
	IGlobalIndex,
	UnifiedPath_string,
	UnifiedPathPart_string
} from '../types'
import { LoggerHelper } from '../helper/LoggerHelper'
import { SetHelper } from '../helper/SetHelper'
import { UnitHelper } from '../helper/UnitHelper'

type UnifiedPathOnlyForPathNode<T> =
	T extends SourceFileMetaDataTreeType.File |
	SourceFileMetaDataTreeType.Directory |
	SourceFileMetaDataTreeType.Module ? UnifiedPath : undefined

type IndexTypeMap = {
	[SourceFileMetaDataTreeType.Module]: ModuleIndex,
	[SourceFileMetaDataTreeType.Directory]: ModuleIndex,
	[SourceFileMetaDataTreeType.File]: PathIndex,
	[SourceFileMetaDataTreeType.Root]: GlobalIndex
}

type IndexPerType<T extends SourceFileMetaDataTreeType> = IndexTypeMap[T]

function areNumbersClose(a: number, b: number, epsilon = 1e-10) {
	return Math.abs(a - b) < epsilon
}

export class SourceFileMetaDataTree<T extends SourceFileMetaDataTreeType> extends BaseModel{
	private _lang_internalHeadlessSensorValues?: SensorValues
	private _aggregatedLangInternalSourceNodeMetaData?: AggregatedSourceNodeMetaData
	private _aggregatedInternSourceMetaData?: AggregatedSourceNodeMetaData
	private _aggregatedExternSourceMetaData?: AggregatedSourceNodeMetaData
	type: T
	filePath: UnifiedPathOnlyForPathNode<T>
	private _langInternalChildren?: ModelMap<
	LangInternalPath_string,
	SourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>
	private _internChildren?: ModelMap<
	UnifiedPathPart_string,
	SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>>
	private _externChildren?: ModelMap<
	NodeModuleIdentifier_string, SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>
	sourceFileMetaData?: SourceFileMetaData

	index: IndexPerType<T>

	constructor(
		type: T,
		filePath: UnifiedPathOnlyForPathNode<T>,
		index: IndexPerType<T>
	) {
		super()
		this.type = type
		this.filePath = filePath
		this.index = index
	}

	globalIndex(): GlobalIndex {
		switch (this.type) {
			case SourceFileMetaDataTreeType.Root:
				return (this as SourceFileMetaDataTree<SourceFileMetaDataTreeType.Root>).index
			case SourceFileMetaDataTreeType.File:
				return (this as SourceFileMetaDataTree<SourceFileMetaDataTreeType.File>).index.moduleIndex.globalIndex
			case SourceFileMetaDataTreeType.Directory:
			case SourceFileMetaDataTreeType.Module:
				return (this as SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory>).index.globalIndex
		}
		throw new Error('SourceFileMetaDataTree.globalIndex: unexpected type')
	}

	static isRootNode(
		data: SourceFileMetaDataTree<SourceFileMetaDataTreeType> | ISourceFileMetaDataTree<SourceFileMetaDataTreeType>
	): data is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Root> {
		return data.type === SourceFileMetaDataTreeType.Root
	}

	static isFileNode(
		data: SourceFileMetaDataTree<SourceFileMetaDataTreeType> | ISourceFileMetaDataTree<SourceFileMetaDataTreeType>
	): data is SourceFileMetaDataTree<SourceFileMetaDataTreeType.File> {
		return data.type === SourceFileMetaDataTreeType.File
	}

	static isDirectoryNode(
		data: SourceFileMetaDataTree<SourceFileMetaDataTreeType> | ISourceFileMetaDataTree<SourceFileMetaDataTreeType>
	): data is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory> {
		return data.type === SourceFileMetaDataTreeType.Directory
	}

	static isModuleNode(
		data: SourceFileMetaDataTree<SourceFileMetaDataTreeType> | ISourceFileMetaDataTree<SourceFileMetaDataTreeType>
	): data is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module> {
		return data.type === SourceFileMetaDataTreeType.Module
	}

	isRoot(): this is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Root>{
		return SourceFileMetaDataTree.isRootNode(this)
	}

	isFile(): this is SourceFileMetaDataTree<SourceFileMetaDataTreeType.File> {
		return SourceFileMetaDataTree.isFileNode(this)
	}

	isDirectory(): this is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory> {
		return SourceFileMetaDataTree.isDirectoryNode(this)
	}

	isModule(): this is SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module> {
		return SourceFileMetaDataTree.isModuleNode(this)
	}

	get lang_internalHeadlessSensorValues() {
		if (this._lang_internalHeadlessSensorValues === undefined) {
			this._lang_internalHeadlessSensorValues = new SensorValues({})
		}
		return this._lang_internalHeadlessSensorValues
	}

	set lang_internalHeadlessSensorValues(value: SensorValues) {
		this._lang_internalHeadlessSensorValues = value
	}

	get aggregatedLangInternalSourceNodeMetaData(): AggregatedSourceNodeMetaData {
		if (!this._aggregatedLangInternalSourceNodeMetaData) {
			this._aggregatedLangInternalSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				)
			)
		}
		return this._aggregatedLangInternalSourceNodeMetaData
	}

	get aggregatedInternSourceMetaData(): AggregatedSourceNodeMetaData {
		if (!this._aggregatedInternSourceMetaData) {
			this._aggregatedInternSourceMetaData = new AggregatedSourceNodeMetaData(
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				),
			)
		}
		return this._aggregatedInternSourceMetaData
	}

	get aggregatedExternSourceMetaData(): AggregatedSourceNodeMetaData {
		if (!this._aggregatedExternSourceMetaData) {
			this._aggregatedExternSourceMetaData = new AggregatedSourceNodeMetaData(
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({}),
					undefined
				),
			)
		}
		return this._aggregatedExternSourceMetaData
	}

	get totalAggregatedSourceMetaData(): AggregatedSourceNodeMetaData {
		return AggregatedSourceNodeMetaData.join(
			this.aggregatedLangInternalSourceNodeMetaData,
			this.aggregatedInternSourceMetaData,
			this.aggregatedExternSourceMetaData
		)
	}

	get langInternalChildren(): ModelMap<
	LangInternalPath_string,
	SourceFileMetaDataTree<SourceFileMetaDataTreeType.File>> {
		if (!this._langInternalChildren) {
			this._langInternalChildren = new ModelMap<
			LangInternalPath_string,
			SourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>('string')
		}
		return this._langInternalChildren
	}

	get internChildren(): ModelMap<
	UnifiedPathPart_string,
	SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>> {
		if (!this._internChildren) {
			this._internChildren = new ModelMap<
			UnifiedPathPart_string,
			SourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>>('string')
		}
		return this._internChildren
	}

	get externChildren(): ModelMap<
	NodeModuleIdentifier_string,
	SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>> {
		if (!this._externChildren) {
			this._externChildren = new ModelMap<
			NodeModuleIdentifier_string, SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>('string')
		}
		return this._externChildren
	}

	storeToFile(
		filePath: UnifiedPath,
		kind?: 'pretty-json' | 'json'
	) {
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(filePath.dirName().toPlatformString())
		}

		switch (kind !== undefined ? kind : 'json') {
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
			default:
				break
		}
	}

	validate() {
		if (this.type === SourceFileMetaDataTreeType.File) {
			this.sourceFileMetaData?.validate()
			return
		}

		const totals = []
		const maxs = []
		for (const sourceFileMetaData of this.internChildren.values()) {
			totals.push(sourceFileMetaData.aggregatedInternSourceMetaData.total)
			maxs.push(sourceFileMetaData.aggregatedInternSourceMetaData.max)
		}

		const total = SourceNodeMetaData.sum(...totals)
		const max = SourceNodeMetaData.max(...maxs)

		// IMPORTANT to change when new measurement type gets added
		if (this.type === SourceFileMetaDataTreeType.Root) {
			total.sensorValues.aggregatedCPUTime = UnitHelper.sumMicroSeconds(
				total.sensorValues.aggregatedCPUTime,
				this.lang_internalHeadlessSensorValues.aggregatedCPUTime,
				1
			)
			total.sensorValues.aggregatedCPUEnergyConsumption = UnitHelper.sumMilliJoule(
				total.sensorValues.aggregatedCPUEnergyConsumption,
				this.lang_internalHeadlessSensorValues.aggregatedCPUEnergyConsumption,
				1
			)
			total.sensorValues.aggregatedRAMEnergyConsumption = UnitHelper.sumMilliJoule(
				total.sensorValues.aggregatedRAMEnergyConsumption,
				this.lang_internalHeadlessSensorValues.aggregatedRAMEnergyConsumption,
				1
			)
		}

		if (total.sensorValues.aggregatedCPUTime !== 
			total.sensorValues.selfCPUTime +
			total.sensorValues.internCPUTime +
			total.sensorValues.externCPUTime +
			total.sensorValues.langInternalCPUTime
		||
			!areNumbersClose(
				total.sensorValues.aggregatedCPUEnergyConsumption,
				total.sensorValues.selfCPUEnergyConsumption +
				total.sensorValues.internCPUEnergyConsumption +
				total.sensorValues.externCPUEnergyConsumption +
				total.sensorValues.langInternalCPUEnergyConsumption
			)
			||
			!areNumbersClose(
				total.sensorValues.aggregatedRAMEnergyConsumption,
				total.sensorValues.selfRAMEnergyConsumption +
				total.sensorValues.internRAMEnergyConsumption +
				total.sensorValues.externRAMEnergyConsumption +
				total.sensorValues.langInternalRAMEnergyConsumption
			)
		) {
			LoggerHelper.error(
				total.sensorValues,
				this.filePath?.toString()
			)
			throw new Error('SourceFileMetaDataTree.validate: Assertion error aggregatedCPUTime is not correct')
		}

		if (!SourceNodeMetaData.equals(this.aggregatedInternSourceMetaData.max, max)) {
			LoggerHelper.error(max, this.aggregatedInternSourceMetaData.max, this.filePath?.toString())
			throw new Error('SourceFileMetaDataTree.validate: Assertion error max is not correct ' + this.filePath?.toString())
		}
	}

	toJSON(): ISourceFileMetaDataTree<T> {
		if (process.env.NODE_ENV === 'test') {
			this.validate()
		}
		return {
			lang_internalHeadlessSensorValues: this._lang_internalHeadlessSensorValues?.toJSON(),
			aggregatedLangInternalSourceNodeMetaData: this._aggregatedLangInternalSourceNodeMetaData?.toJSON(),
			aggregatedInternSourceMetaData: this._aggregatedInternSourceMetaData?.toJSON(),
			aggregatedExternSourceMetaData: this._aggregatedExternSourceMetaData?.toJSON(),
			type: this.type,
			filePath: this.filePath?.toJSON() as UnifiedPath_stringOnlyForPathNode<T>,
			langInternalChildren: this.langInternalChildren.toJSON<
			ISourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>(),
			internChildren: this.internChildren.toJSON<
			ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>>() || {},
			externChildren: this.externChildren.toJSON<ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>(),
			sourceFileMetaData: this.sourceFileMetaData?.toJSON(),
			globalIndex: (this.isRoot() ? this.index.toJSON() : undefined) as IGlobalIndexOnlyForRootNode<T>,
			engineModule: (
				this.isRoot() ? this.index.engineModule.toJSON() : undefined) as IEngineModuleOnlyForRootNode<T>,
		}
	}

	static fromJSON<
		T extends SourceFileMetaDataTreeType
	>(
		json: string | ISourceFileMetaDataTree<T>,
		type: T,
		indexFromParent: T extends SourceFileMetaDataTreeType.Root ? undefined : IndexPerType<T>
	): SourceFileMetaDataTree<T> {
		let data: ISourceFileMetaDataTree<T>
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		let index: IndexPerType<T>
		if (type !== data.type) {
			throw new Error('SourceFileMetaDataTree.fromJSON: given type and type of input data is not the same')
		}
		if (SourceFileMetaDataTree.isRootNode(data)) {
			if (data.globalIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.fromJSON: input does not contain a globalIndex')
			}
			index = GlobalIndex.fromJSON(
				data.globalIndex as IGlobalIndex,
				NodeModule.fromJSON((data as ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Root>).engineModule)
			) as IndexPerType<T>
		} else {
			if (indexFromParent === undefined) {
				throw new Error('SourceFileMetaDataTree.fromJSON: indexFromParent must be given for non root nodes')
			}
			index = indexFromParent as IndexPerType<T>
		}
		const result = new SourceFileMetaDataTree<T>(
			data.type,
			((
				data.type === SourceFileMetaDataTreeType.File ||
				data.type === SourceFileMetaDataTreeType.Directory ||
				data.type === SourceFileMetaDataTreeType.Module
			) ? new UnifiedPath(data.filePath as unknown as string) : undefined) as UnifiedPathOnlyForPathNode<T>,
			index
		)
		if (data.lang_internalHeadlessSensorValues) {
			result._lang_internalHeadlessSensorValues =
				SensorValues.fromJSON(data.lang_internalHeadlessSensorValues)
		}
		if (data.aggregatedLangInternalSourceNodeMetaData) {
			result._aggregatedLangInternalSourceNodeMetaData =
				AggregatedSourceNodeMetaData.fromJSON(data.aggregatedLangInternalSourceNodeMetaData)
		}
		if (data.aggregatedInternSourceMetaData) {
			result._aggregatedInternSourceMetaData =
				AggregatedSourceNodeMetaData.fromJSON(data.aggregatedInternSourceMetaData)
		}
		if (data.aggregatedExternSourceMetaData) {
			result._aggregatedExternSourceMetaData = 
				AggregatedSourceNodeMetaData.fromJSON(data.aggregatedExternSourceMetaData)
		}

		if (data.sourceFileMetaData) {
			if (index === undefined) {
				throw new Error('SourceFileMetaDataTree.fromJSON: pathIndex is missing')
			}
			result.sourceFileMetaData = SourceFileMetaData.fromJSON(data.sourceFileMetaData, index as PathIndex)
		}
		if (data.langInternalChildren) {
			for (const [langInternalPath, subTree] of Object.entries(data.langInternalChildren)) {
				const indexToPass: PathIndex | undefined = type === SourceFileMetaDataTreeType.Root ?
					(index as IndexPerType<SourceFileMetaDataTreeType.Root>).getLangInternalIndex('get')?.getFilePathIndex('get', subTree.filePath)
					: (index as ModuleIndex)?.globalIndex?.getLangInternalIndex('get')?.getFilePathIndex('get', subTree.filePath)
				if (indexToPass === undefined) {
					LoggerHelper.error((index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get'))
					throw new Error('SourceFileMetaDataTree.fromJSON: (langInternal children) could not resolve index for subTree')
				}
				result.langInternalChildren.set(
					langInternalPath as LangInternalPath_string,
					SourceFileMetaDataTree.fromJSON<
					SourceFileMetaDataTreeType.File
					>(
						subTree,
						subTree.type,
						indexToPass
					)
				)
			}
		}
		if (data.internChildren) {
			for (const [filePart, subTree] of Object.entries(data.internChildren)) {
				let indexToPass: PathIndex | ModuleIndex | undefined
				switch (subTree.type) {
					case SourceFileMetaDataTreeType.Directory:
						indexToPass = type === SourceFileMetaDataTreeType.Root ? 
							(index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get')
							: (index as ModuleIndex)
						break
					case SourceFileMetaDataTreeType.File:
						indexToPass = type === SourceFileMetaDataTreeType.Root ?
							(index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get')?.getFilePathIndex('get', subTree.filePath)
							: (index as ModuleIndex).getFilePathIndex('get', subTree.filePath)
						break
					default:
						throw new Error('SourceFileMetaDataTree.fromJSON: unexpected subTree type')
				}
				if (indexToPass === undefined) {
					LoggerHelper.error((index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get'))
					throw new Error('SourceFileMetaDataTree.fromJSON: (intern children) could not resolve index for subTree')
				}
				result.internChildren.set(
					filePart as UnifiedPathPart_string,
					SourceFileMetaDataTree.fromJSON<
					SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File
					>(
						subTree,
						subTree.type,
						indexToPass
					)
				)
			}
		}
		if (data.externChildren) {
			for (const [moduleIdentifier, subTree] of Object.entries(data.externChildren)) {
				let indexToPass: ModuleIndex | undefined
				switch (type) {
					case SourceFileMetaDataTreeType.Root:
						indexToPass = (index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get', moduleIdentifier as NodeModuleIdentifier_string)
						break
					case SourceFileMetaDataTreeType.Module:
						indexToPass = (index as IndexPerType<SourceFileMetaDataTreeType.Module>).globalIndex.getModuleIndex('get', moduleIdentifier as NodeModuleIdentifier_string)
						break
					default:
						throw new Error('SourceFileMetaDataTree.fromJSON: unexpected subTree type')
				}
				if (indexToPass === undefined) {
					throw new Error('SourceFileMetaDataTree.fromJSON: (extern children) could not resolve index for subTree')
				}
				result.externChildren.set(
					moduleIdentifier as NodeModuleIdentifier_string,
					SourceFileMetaDataTree.fromJSON(subTree, subTree.type, indexToPass)
				)
			}
		}
		return result
	}

	static loadFromFile(filePath: UnifiedPath): SourceFileMetaDataTree<SourceFileMetaDataTreeType.Root> | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return SourceFileMetaDataTree.fromJSON(
			fs.readFileSync(filePath.toPlatformString()).toString(),
			SourceFileMetaDataTreeType.Root,
			undefined
		)
	}

	addToAggregatedLangInternalSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData) {
		this.aggregatedLangInternalSourceNodeMetaData.total = SourceNodeMetaData.sum(
			this.aggregatedLangInternalSourceNodeMetaData.total,
			aggregatedSourceNodeMetaData.total
		)
		this.aggregatedLangInternalSourceNodeMetaData.max = SourceNodeMetaData.max(
			this.aggregatedLangInternalSourceNodeMetaData.max,
			aggregatedSourceNodeMetaData.max
		)
	}

	addToAggregatedInternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData) {
		this.aggregatedInternSourceMetaData.total = SourceNodeMetaData.sum(
			this.aggregatedInternSourceMetaData.total,
			aggregatedSourceNodeMetaData.total
		)
		this.aggregatedInternSourceMetaData.max = SourceNodeMetaData.max(
			this.aggregatedInternSourceMetaData.max,
			aggregatedSourceNodeMetaData.max
		)
	}

	addToAggregatedExternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData) {
		this.aggregatedExternSourceMetaData.total = SourceNodeMetaData.sum(
			this.aggregatedExternSourceMetaData.total,
			aggregatedSourceNodeMetaData.total
		)
		this.aggregatedExternSourceMetaData.max = SourceNodeMetaData.max(
			this.aggregatedExternSourceMetaData.max,
			aggregatedSourceNodeMetaData.max
		)
	}

	static fromProjectReport(projectReport: ProjectReport) {
		const tree = new SourceFileMetaDataTree(
			SourceFileMetaDataTreeType.Root,
			undefined,
			projectReport.globalIndex
		)
		tree.addProjectReport(projectReport)
		tree.lang_internalHeadlessSensorValues = SensorValues.fromJSON(
			projectReport.lang_internalHeadlessSensorValues.toJSON()
		)
		return tree
	}

	insertLangInternalPath(
		langInternalPath: LangInternalPath_string,
		aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData,
		sourceFileMetaData: SourceFileMetaData,
	): SourceFileMetaDataTree<SourceFileMetaDataTreeType.File> {
		this.addToAggregatedLangInternalSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData)
		let child = this.langInternalChildren.get(langInternalPath)
		if (!child) {
			const moduleIndex = (
				this.isRoot() ?
					this.index.getModuleIndex('get') :
					this.index as ModuleIndex)?.globalIndex.getLangInternalIndex('get')
			const pathIndex = moduleIndex?.getFilePathIndex('get', langInternalPath)
			if (pathIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.insertLangInternalPath: could not resolve path index')
			}
			child = new SourceFileMetaDataTree(
				SourceFileMetaDataTreeType.File,
				new UnifiedPath(langInternalPath),
				pathIndex
			)
			child.sourceFileMetaData = sourceFileMetaData
			child.addToAggregatedInternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData)
			this.langInternalChildren.set(langInternalPath, child)
			return child
		} else {
			throw new Error('SourceFileMetaDataTree.insertLangInternalPath: path was already inserted ' + `${langInternalPath}`)
		}
	}

	insertPath(
		filePathParts: UnifiedPathPart_string[],
		aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData,
		sourceFileMetaData: SourceFileMetaData,
	): SourceFileMetaDataTree<SourceFileMetaDataTreeType.File | SourceFileMetaDataTreeType.Directory> {
		this.addToAggregatedInternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData)
		let child = this.internChildren.get(filePathParts[0])
		const filePath = this.type === SourceFileMetaDataTreeType.Module ? new UnifiedPath('./') :
			(this.filePath === undefined ? new UnifiedPath('./') : this.filePath)

		if (filePathParts.length === 1) {
			if (!child) {
				const moduleIndex = (this.isRoot() ? this.index.getModuleIndex('get') : this.index as ModuleIndex)
				const pathIndex = moduleIndex?.getFilePathIndex('get', filePath.join(...filePathParts).toString())
				if (pathIndex === undefined) {
					throw new Error('SourceFileMetaDataTree.insertPath: could not resolve path index')
				}
				child = new SourceFileMetaDataTree(
					SourceFileMetaDataTreeType.File,
					filePath.join(filePathParts[0]),
					pathIndex
				)
				child.sourceFileMetaData = sourceFileMetaData
				child.addToAggregatedInternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData)
				this.internChildren.set(filePathParts[0], child)
				return child
			} else {
				throw new Error('SourceFileMetaDataTree.insertPath: path was already inserted ' + `${filePath.toString()}/${filePathParts[0]}`)
			}
		}
		if (!child) {
			const moduleIndex = (this.isRoot() ? this.index.getModuleIndex('get') : this.index as IndexPerType<SourceFileMetaDataTreeType.Module>)
			if (moduleIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.insertPath: could not resolve module index')
			}
			child = new SourceFileMetaDataTree(
				SourceFileMetaDataTreeType.Directory,
				filePath.toString() === '' ? new UnifiedPath(filePathParts[0]) : filePath.join(filePathParts[0]),
				moduleIndex
			)
			this.internChildren.set(filePathParts[0], child)
		}
		return child.insertPath(
			filePathParts.slice(1),
			aggregatedSourceNodeMetaData,
			sourceFileMetaData,
		)
	}

	addExternReport(moduleReport: ModuleReport, index: ModuleIndex) {
		const child = new SourceFileMetaDataTree(
			SourceFileMetaDataTreeType.Module,
			new UnifiedPath('node_modules/' + moduleReport.nodeModule.identifier),
			index
		)
		child.addInternReport(moduleReport)
		for (const [moduleID, externModuleReport] of moduleReport.extern.entries()) {
			const childIndex = index.globalIndex.getModuleIndexByID(moduleID)
			if (childIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.addExternReport: could not resolve module index')
			}
			child.addExternReport(externModuleReport, childIndex)
		}
		this.addToAggregatedExternSourceNodeMetaDataOfTree(child.totalAggregatedSourceMetaData)

		this.externChildren.set(moduleReport.nodeModule.identifier, child)
	}

	addInternReport(projectReport: Report) {
		for (const [filePathID, sourceFileMetaData] of projectReport.lang_internal.entries()) {
			const filePathIndex = projectReport.getPathIndexByID(filePathID)
			
			if (filePathIndex === undefined) {
				throw new Error(
					`SourceFileMetaDataTree.addInternReport: could not resolve path from pathID: ${filePathID}`
				)
			}

			const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				sourceFileMetaData.totalSourceNodeMetaData().sum,
				sourceFileMetaData.maxSourceNodeMetaData()
			)
			const fileNode = this.insertLangInternalPath(
				filePathIndex.identifier as LangInternalPath_string,
				aggregatedSourceNodeMetaData,
				sourceFileMetaData
			)
			fileNode.sourceFileMetaData = sourceFileMetaData
		}

		for (const [filePathID, sourceFileMetaData] of projectReport.intern.entries()) {
			const filePathIndex = projectReport.getPathIndexByID(filePathID)

			if (filePathIndex === undefined) {
				throw new Error(
					`SourceFileMetaDataTree.addInternReport: could not resolve path from pathID: ${filePathID}`
				)
			}

			const filePathParts = new UnifiedPath(filePathIndex.identifier).split()

			const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				sourceFileMetaData.totalSourceNodeMetaData().sum,
				sourceFileMetaData.maxSourceNodeMetaData()
			)

			const fileNode = this.insertPath(
				filePathParts,
				aggregatedSourceNodeMetaData,
				sourceFileMetaData,
			)
			fileNode.sourceFileMetaData = sourceFileMetaData
		}
	}

	addProjectReport(projectReport: ProjectReport) {
		if (!this.isRoot()) {
			throw new Error('SourceFileMetaDataTree.addProjectReport: can only be executed on root nodes')
		}

		this.addInternReport(projectReport)

		for (const [moduleID, externModuleReport] of projectReport.extern.entries()) {
			const childIndex = this.index.getModuleIndexByID(moduleID)
			if (childIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.addExternReport: could not resolve module index')
			}
			this.addExternReport(externModuleReport, childIndex)
		}
	}

	_mergeReferences(
		...references: ModelMap<PathID_number, SensorValues>[]
	) {
		const result = new ModelMap<PathID_number, SensorValues>('number')
		for (const reference of references) {
			for (const [pathID, sensorValues] of reference.entries()) {
				const accumulatedSensorValues = result.get(pathID)
				if (accumulatedSensorValues !== undefined) {
					result.set(pathID, SensorValues.sum(accumulatedSensorValues, sensorValues))
				} else {
					result.set(pathID, sensorValues)
				}
			}
		}
		return result
	}

	filter(
		includedFilterPath: string | undefined,
		excludedFilterPath: string | undefined
	) {
		const self = this // eslint-disable-line @typescript-eslint/no-this-alias
		const includeCache = new Map<number, boolean>()
		const excludeCache = new Map<number, boolean>()
		const pathIndexCache = new Map<number, PathIndex>()

		// Normalize filter paths
		if (includedFilterPath && !(includedFilterPath.endsWith('/*') || includedFilterPath.endsWith('/'))) {
			includedFilterPath = includedFilterPath + '/*'
		} else if (includedFilterPath && includedFilterPath.endsWith('/')) {
			includedFilterPath = includedFilterPath + '*'
		}

		// check if the path is included/excluded in the filter
		function checkGlob(
			filePath: UnifiedPath_string | LangInternalPath_string,
			filterPath: string
		) {
			if (filePath === undefined) {
				throw new Error('SourceFileMetaDataTree.checkGlob: filePath is undefined')
			}
			const normalizedDirectory = filePath.startsWith('./') ?
				filePath.substring(2) : filePath
			const normalizedFilterPath = filterPath.startsWith('./') ? filterPath.substring(2) : filterPath
			const includeRe = globToRegExp(normalizedFilterPath, { extended: true })
			return includeRe.test(normalizedDirectory) || includeRe.test(normalizedDirectory + '/')
		}

		function pathIndexByID(pathID: PathID_number) {
			let pathIndex = pathIndexCache.get(pathID)
			if (pathIndex === undefined) {
				pathIndex = self.globalIndex().getPathIndexByID(pathID)
				if (pathIndex === undefined) {
					throw new Error('SourceFileMetaDataTree.filter: pathIndex is undefined')
				}
				pathIndexCache.set(pathID, pathIndex)
			}
			return pathIndex
		}

		// Filter function on pathIndex
		function filterPaths(pathIndexObj: PathIndex | PathID_number) {
			const pathIndex = pathIndexObj instanceof PathIndex ? pathIndexObj : pathIndexByID(pathIndexObj)

			if (pathIndex.id === undefined) {
				throw new Error('SourceFileMetaDataTree.filter: pathIndex.id is undefined')
			}
			let isIncludedNode = includeCache.get(pathIndex.id)
			let isExcludedNode = excludeCache.get(pathIndex.id)

			if (isIncludedNode === undefined) {
				isIncludedNode = includedFilterPath ? checkGlob(pathIndex.identifier, includedFilterPath) : true
				includeCache.set(
					pathIndex.id,
					isIncludedNode
				)
			}
			if (isExcludedNode === undefined) {
				isExcludedNode = excludedFilterPath ? checkGlob(pathIndex.identifier, excludedFilterPath) : false
				excludeCache.set(
					pathIndex.id,
					isExcludedNode
				)
			}

			return isIncludedNode && !isExcludedNode
		}


		function filterReferences(
			references: ModelMap<PathID_number, SensorValues>
		) {
			for (const pathID of references.keys()) {
				if (!filterPaths(pathID)) {
					references.delete(pathID)
				}
			}
		}

		// call the filter function
		return this._filter(filterPaths, filterReferences)
	}

	_filter(
		filterPaths: (pathIndex: PathIndex) => boolean,
		filterReferences: (references: ModelMap<PathID_number, SensorValues>) => void
	): {
			node: SourceFileMetaDataTree<T> | null,
			// sum of all sensor values of the children without references
			sensorValues?: SensorValues,
			// sum of all the intern references by pathID
			internReferences: ModelMap<PathID_number, SensorValues>,
			// sum of all the extern references by pathID
			externReferences: ModelMap<PathID_number, SensorValues>,
			// sum of all the langInternal references by pathID
			langInternalReferences: ModelMap<PathID_number, SensorValues>,
			containsFiles: Set<PathID_number>
		} {
		const allSensorValuesToSum: SensorValues[] = []
		const allInternReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
		const allExternReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
		const allLangInternalReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
		const allContainsFilesToMerge: Set<PathID_number>[] = []

		const node = new SourceFileMetaDataTree(
			this.type,
			this.filePath,
			this.index
		)
		node.lang_internalHeadlessSensorValues = SensorValues.fromJSON(
			this.lang_internalHeadlessSensorValues.toJSON()
		)
		node.sourceFileMetaData = this.sourceFileMetaData

		if (SourceFileMetaDataTree.isFileNode(this)) {
			if (this.sourceFileMetaData === undefined) {
				throw new Error('SourceFileMetaDataTree.filter: sourceFileMetaData is undefined')
			}
			const pathID = this.sourceFileMetaData.pathIndex.id
			if (pathID === undefined) {
				throw new Error('SourceFileMetaDataTree.filter: pathID is undefined')
			}

			const max = this.sourceFileMetaData.maxSourceNodeMetaData()
			const total = this.sourceFileMetaData.totalSourceNodeMetaData()
			filterReferences(total.intern)
			filterReferences(total.extern)
			filterReferences(total.langInternal)
			allInternReferencesToMerge.push(total.intern)
			allExternReferencesToMerge.push(total.extern)
			allLangInternalReferencesToMerge.push(total.langInternal)
			allContainsFilesToMerge.push(new Set([pathID]))
			const internSum = SensorValues.sum(...total.intern.values())
			const externSum = SensorValues.sum(...total.extern.values())
			const langInternalSum = SensorValues.sum(...total.langInternal.values())

			// clones the total sensor values but removes the references
			const ownSensorValues = total.sum.sensorValues.cloneAsIsolated()
			allSensorValuesToSum.push(ownSensorValues)

			node.addToAggregatedInternSourceNodeMetaDataOfTree(
				new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						ownSensorValues.add({
							internSensorValues: internSum,
							externSensorValues: externSum,
							langInternalSensorValues: langInternalSum
						}),
						undefined
					),
					max
				)
			)
		}

		if (this.langInternalChildren.size > 0) {
			const sensorValuesToSum: SensorValues[] = []
			const maxSourceNodeMetaDataToMax: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>[] = []
			const internReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const externReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const langInternalReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const containsFilesToMerge: Set<PathID_number>[] = []

			for (const [langInternalPath, child] of this.langInternalChildren.entries()) {
				const {
					node: filteredChild,
					sensorValues: filteredChildSensorValues,
					internReferences: filteredIntern,
					externReferences: filteredExtern,
					langInternalReferences: filteredLangInternal,
					containsFiles: filteredContainsFiles
				} = child._filter(filterPaths, filterReferences)
				if (filteredChild) {
					node.langInternalChildren.set(langInternalPath, filteredChild)

					if (filteredChildSensorValues) {
						sensorValuesToSum.push(filteredChildSensorValues)
					}
					internReferencesToMerge.push(filteredIntern)
					externReferencesToMerge.push(filteredExtern)
					langInternalReferencesToMerge.push(filteredLangInternal)
					containsFilesToMerge.push(filteredContainsFiles)

					maxSourceNodeMetaDataToMax.push(filteredChild.totalAggregatedSourceMetaData.max)
				}
			}
			const internReferences = this._mergeReferences(...internReferencesToMerge)
			const externReferences = this._mergeReferences(...externReferencesToMerge)
			const langInternalReferences = this._mergeReferences(...langInternalReferencesToMerge)
			const containsFilesInChildren = SetHelper.union(...containsFilesToMerge)
			for (const pathID of containsFilesInChildren) {
				internReferences.delete(pathID)
				externReferences.delete(pathID)
				langInternalReferences.delete(pathID)
			}
			allInternReferencesToMerge.push(internReferences)
			allExternReferencesToMerge.push(externReferences)
			allLangInternalReferencesToMerge.push(langInternalReferences)

			node.addToAggregatedLangInternalSourceNodeMetaDataOfTree(
				new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						SensorValues.sum(
							...sensorValuesToSum,
							...internReferences.values()
						),
						undefined
					),
					SourceNodeMetaData.max(...maxSourceNodeMetaDataToMax)
				)
			)
		}
		
		if (this.internChildren.size > 0) {
			const sensorValuesToSum: SensorValues[] = []
			const maxSourceNodeMetaDataToMax: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>[] = []
			const internReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const externReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const langInternalReferencesToMerge: ModelMap<PathID_number, SensorValues>[] = []
			const containsFilesToMerge: Set<PathID_number>[] = []

			for (const [internPath, child] of this.internChildren.entries()) {
				const {
					node: filteredChild,
					sensorValues: filteredChildSensorValues,
					internReferences: filteredIntern,
					externReferences: filteredExtern,
					langInternalReferences: filteredLangInternal,
					containsFiles: filteredContainsFiles
				} = child._filter(filterPaths, filterReferences)
				if (filteredChild) {
					node.internChildren.set(internPath, filteredChild)

					if (filteredChildSensorValues) {
						sensorValuesToSum.push(filteredChildSensorValues)
					}
					internReferencesToMerge.push(filteredIntern)
					externReferencesToMerge.push(filteredExtern)
					langInternalReferencesToMerge.push(filteredLangInternal)
					containsFilesToMerge.push(filteredContainsFiles)

					maxSourceNodeMetaDataToMax.push(filteredChild.totalAggregatedSourceMetaData.max)
				}
			}
			const internReferences = this._mergeReferences(...internReferencesToMerge)
			const externReferences = this._mergeReferences(...externReferencesToMerge)
			const langInternalReferences = this._mergeReferences(...langInternalReferencesToMerge)
			const containsFilesInChildren = SetHelper.union(...containsFilesToMerge)
			for (const pathID of containsFilesInChildren) {
				internReferences.delete(pathID)
				externReferences.delete(pathID)
				langInternalReferences.delete(pathID)
			}

			const sensorValuesSum = SensorValues.sum(...sensorValuesToSum)
			const internReferencesSum = SensorValues.sum(...internReferences.values())
			const externReferencesSum = SensorValues.sum(...externReferences.values())
			const langInternalReferencesSum = SensorValues.sum(...langInternalReferences.values())
			allInternReferencesToMerge.push(internReferences)
			allExternReferencesToMerge.push(externReferences)
			allLangInternalReferencesToMerge.push(langInternalReferences)
			allContainsFilesToMerge.push(containsFilesInChildren)
			allSensorValuesToSum.push(sensorValuesSum)
			node.addToAggregatedInternSourceNodeMetaDataOfTree(
				new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						sensorValuesSum.add({
							internSensorValues: internReferencesSum,
							externSensorValues: externReferencesSum,
							langInternalSensorValues: langInternalReferencesSum
						}),
						undefined
					),
					SourceNodeMetaData.max(...maxSourceNodeMetaDataToMax)
				)
			)
		}

		if (this.externChildren.size > 0) {
			const totalSourceNodeMetaDataToMerge: AggregatedSourceNodeMetaData[] = []

			for (const [moduleIdentifier, child] of this.externChildren.entries()) {
				const {
					node: filteredChild
				} = child._filter(filterPaths, filterReferences)
				if (filteredChild) {
					node.externChildren.set(moduleIdentifier, filteredChild)

					totalSourceNodeMetaDataToMerge.push(filteredChild.aggregatedInternSourceMetaData)
				}
			}
			node.addToAggregatedExternSourceNodeMetaDataOfTree(
				AggregatedSourceNodeMetaData.join(...totalSourceNodeMetaDataToMerge)
			)
		}
		const internReferences = this._mergeReferences(...allInternReferencesToMerge)
		const externReferences = this._mergeReferences(...allExternReferencesToMerge)
		const langInternalReferences = this._mergeReferences(...allLangInternalReferencesToMerge)

		if (SourceFileMetaDataTree.isFileNode(this)) {
			const survivesFilter = filterPaths(this.index)

			if (!survivesFilter) {
				return {
					node: null,
					sensorValues: undefined,
					internReferences,
					externReferences,
					langInternalReferences,
					containsFiles: SetHelper.union(...allContainsFilesToMerge)
				}
			}
		}

		if (!SourceFileMetaDataTree.isFileNode(this) &&
			node.internChildren.size === 0 &&
			node.langInternalChildren.size === 0 &&
			node.externChildren.size === 0
		) {
			return {
				node: null,
				sensorValues: undefined,
				internReferences,
				externReferences,
				langInternalReferences,
				containsFiles: SetHelper.union(...allContainsFilesToMerge)
			}
		}


		return {
			node,
			sensorValues: SensorValues.sum(...allSensorValuesToSum),
			internReferences,
			externReferences,
			langInternalReferences,
			containsFiles: SetHelper.union(...allContainsFilesToMerge)
		}
	}
}