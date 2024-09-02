import * as fs from 'fs'

import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import {
	SourceFileMetaData,
	ISourceFileMetaData,
	AggregatedSourceNodeMetaData,
	IAggregatedSourceNodeMetaData
} from './SourceFileMetaData'
import { SourceNodeMetaData, SourceNodeMetaDataType } from './SourceNodeMetaData'
import { Report } from './Report'
import { ProjectReport } from './ProjectReport'
import { ModuleReport } from './ModuleReport'
import { INodeModule, NodeModule, NodeModuleIdentifier_string } from './NodeModule'
import { SensorValues } from './SensorValues'
import { PathID_number, PathIndex } from './index/PathIndex'
import { GlobalIndex, IGlobalIndex } from './index/GlobalIndex'
import { ModuleIndex } from './index/ModuleIndex'

import { UnifiedPath } from '../system/UnifiedPath'
import { UnifiedPath_string, UnifiedPathPart_string } from '../types/UnifiedPath.types'
import { LangInternalPath_string } from '../types/SourceNodeIdentifiers.types'
import { PermissionHelper } from '../helper/PermissionHelper'

export enum SourceFileMetaDataTreeType {
	Root = 'Root',
	File = 'File',
	Directory = 'Directory',
	Module = 'Module'
}

type UnifiedPathOnlyForPathNode<T> =
	T extends SourceFileMetaDataTreeType.File | SourceFileMetaDataTreeType.Directory ? UnifiedPath : undefined


type UnifiedPath_stringOnlyForPathNode<T> =
	T extends SourceFileMetaDataTreeType.File | SourceFileMetaDataTreeType.Directory ? UnifiedPath_string : undefined

type IGlobalIndexOnlyForRootNode<T> = T extends SourceFileMetaDataTreeType.Root ? IGlobalIndex : undefined
type IEngineModuleOnlyForRootNode<T> = T extends SourceFileMetaDataTreeType.Root ? INodeModule : undefined

type IndexTypeMap = {
	[SourceFileMetaDataTreeType.Module]: ModuleIndex,
	[SourceFileMetaDataTreeType.Directory]: ModuleIndex,
	[SourceFileMetaDataTreeType.File]: PathIndex,
	[SourceFileMetaDataTreeType.Root]: GlobalIndex
}

type IndexPerType<T extends SourceFileMetaDataTreeType> = IndexTypeMap[T]

export interface ISourceFileMetaDataTree<T extends SourceFileMetaDataTreeType> {
	aggregatedLangInternalSourceNodeMetaData?: IAggregatedSourceNodeMetaData
	aggregatedInternSourceMetaData?: IAggregatedSourceNodeMetaData
	aggregatedExternSourceMetaData?: IAggregatedSourceNodeMetaData
	type: T
	filePath: UnifiedPath_stringOnlyForPathNode<T>
	compiledSourceFilePath?: UnifiedPath_string,
	originalSourceFilePath?: UnifiedPath_string,
	langInternalChildren?: Record<
	LangInternalPath_string,
	ISourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>
	internChildren?: Record<
	UnifiedPathPart_string,
	ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>>
	externChildren?: Record<NodeModuleIdentifier_string, ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>
	sourceFileMetaData?: ISourceFileMetaData
	globalIndex: IGlobalIndexOnlyForRootNode<T>
	engineModule: IEngineModuleOnlyForRootNode<T>
}

export class SourceFileMetaDataTree<T extends SourceFileMetaDataTreeType> extends BaseModel{
	private _aggregatedLangInternalSourceNodeMetaData?: AggregatedSourceNodeMetaData
	private _aggregatedInternSourceMetaData?: AggregatedSourceNodeMetaData
	private _aggregatedExternSourceMetaData?: AggregatedSourceNodeMetaData
	type: T
	filePath: UnifiedPathOnlyForPathNode<T>
	compiledSourceFilePath?: UnifiedPath_string
	originalSourceFilePath?: UnifiedPath_string
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
		index: IndexPerType<T>,
		compiledSourceFilePath?: UnifiedPath_string,
		originalSourceFilePath?: UnifiedPath_string,
	) {
		super()
		this.type = type
		this.filePath = filePath
		this.index = index
		this.compiledSourceFilePath = compiledSourceFilePath
		this.originalSourceFilePath = originalSourceFilePath
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

	get aggregatedLangInternalSourceNodeMetaData(): AggregatedSourceNodeMetaData {
		if (!this._aggregatedLangInternalSourceNodeMetaData) {
			this._aggregatedLangInternalSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
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
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
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
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 0,
						selfCPUTime: 0,
						aggregatedCPUTime: 0,
						internCPUTime: 0,
						externCPUTime: 0,
						langInternalCPUTime: 0
					}),
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

		if (!SourceNodeMetaData.equals(this.aggregatedInternSourceMetaData.total, total)) {
			console.error(total, this.aggregatedInternSourceMetaData.total, this.filePath?.toString())
			throw new Error('SourceFileMetaDataTree.validate: Assertion error total is not correct' + this.filePath?.toString())
		}

		if (!SourceNodeMetaData.equals(this.aggregatedInternSourceMetaData.max, max)) {
			console.error(max, this.aggregatedInternSourceMetaData.max, this.filePath?.toString())
			throw new Error('SourceFileMetaDataTree.validate: Assertion error max is not correct' + this.filePath?.toString())
		}
	}

	toJSON(): ISourceFileMetaDataTree<T> {
		if (process.env.NODE_ENV === 'test') {
			this.validate()
		}
		return {
			aggregatedLangInternalSourceNodeMetaData: this._aggregatedLangInternalSourceNodeMetaData?.toJSON(),
			aggregatedInternSourceMetaData: this._aggregatedInternSourceMetaData?.toJSON(),
			aggregatedExternSourceMetaData: this._aggregatedExternSourceMetaData?.toJSON(),
			type: this.type,
			filePath: this.filePath?.toJSON() as UnifiedPath_stringOnlyForPathNode<T>,
			compiledSourceFilePath: this.compiledSourceFilePath,
			originalSourceFilePath: this.originalSourceFilePath,
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
				data.type === SourceFileMetaDataTreeType.Directory
			) ? new UnifiedPath(data.filePath as unknown as string) : undefined) as UnifiedPathOnlyForPathNode<T>,
			index
		)
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

		result.originalSourceFilePath = data.originalSourceFilePath
		result.compiledSourceFilePath = data.compiledSourceFilePath
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
					console.error((index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get'))
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
					console.error((index as IndexPerType<SourceFileMetaDataTreeType.Root>).getModuleIndex('get'))
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

	static fromProjectReport(projectReport: ProjectReport, mode: 'compiled' | 'original' = 'original') {
		const tree = new SourceFileMetaDataTree(
			SourceFileMetaDataTreeType.Root,
			undefined,
			projectReport.globalIndex
		)
		tree.addProjectReport(projectReport, mode)
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
		compiledSourceFilePath: UnifiedPath_string | undefined,
		originalSourceFilePath: UnifiedPath_string | undefined,
		aggregatedSourceNodeMetaData: AggregatedSourceNodeMetaData,
		sourceFileMetaData: SourceFileMetaData,
	): SourceFileMetaDataTree<SourceFileMetaDataTreeType.File | SourceFileMetaDataTreeType.Directory> {
		this.addToAggregatedInternSourceNodeMetaDataOfTree(aggregatedSourceNodeMetaData)
		let child = this.internChildren.get(filePathParts[0])
		const filePath = this.filePath === undefined ? new UnifiedPath('./') : this.filePath

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
					pathIndex,
					compiledSourceFilePath,
					originalSourceFilePath
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
			compiledSourceFilePath,
			originalSourceFilePath,
			aggregatedSourceNodeMetaData,
			sourceFileMetaData,
		)
	}

	addExternReport(moduleReport: ModuleReport, index: ModuleIndex, mode: 'compiled' | 'original') {
		const child = new SourceFileMetaDataTree(
			SourceFileMetaDataTreeType.Module,
			undefined,
			index
		)
		child.addInternReport(moduleReport, mode)
		for (const [moduleID, externModuleReport] of moduleReport.extern.entries()) {
			const childIndex = index.globalIndex.getModuleIndexByID(moduleID)
			if (childIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.addExternReport: could not resolve module index')
			}
			child.addExternReport(externModuleReport, childIndex, mode)
		}
		this.addToAggregatedExternSourceNodeMetaDataOfTree(child.totalAggregatedSourceMetaData)

		this.externChildren.set(moduleReport.nodeModule.identifier, child)
	}

	addInternReport(projectReport: Report, mode: 'compiled' | 'original') {
		const reversedInternMapping = projectReport.reversedInternMapping

		for (const [filePathID, sourceFileMetaData] of projectReport.lang_internal.entries()) {
			const filePathIndex = projectReport.getPathIndexByID(filePathID)
			
			if (filePathIndex === undefined) {
				throw new Error(
					`SourceFileMetaDataTree.addInternReport: could not resolve path from pathID: ${filePathID}`
				)
			}

			const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				sourceFileMetaData.totalSourceNodeMetaData(),
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
			const reversedFilePathID = reversedInternMapping.get(filePathID as PathID_number) as PathID_number
			const reversedFilePathIndex = reversedFilePathID !== undefined ?
				projectReport.getPathIndexByID(reversedFilePathID) : undefined

			if (filePathIndex === undefined) {
				throw new Error(
					`SourceFileMetaDataTree.addInternReport: could not resolve path from pathID: ${filePathID}`
				)
			}

			const reversedFilePath = reversedFilePathIndex !== undefined ?
				reversedFilePathIndex.identifier as UnifiedPath_string : undefined

			const filePathParts = (mode === 'compiled' || reversedFilePath === undefined) ?
				new UnifiedPath(filePathIndex.identifier).split() :
				new UnifiedPath(reversedFilePath).split()

			const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				sourceFileMetaData.totalSourceNodeMetaData(),
				sourceFileMetaData.maxSourceNodeMetaData()
			)

			const fileNode = this.insertPath(
				filePathParts,
				filePathIndex.identifier as UnifiedPath_string,
				reversedFilePath,
				aggregatedSourceNodeMetaData,
				sourceFileMetaData,
			)
			fileNode.sourceFileMetaData = sourceFileMetaData
		}
	}

	addProjectReport(projectReport: ProjectReport, mode: 'compiled' | 'original') {
		if (!this.isRoot()) {
			throw new Error('SourceFileMetaDataTree.addProjectReport: can only be executed on root nodes')
		}

		this.addInternReport(projectReport, mode)

		for (const [moduleID, externModuleReport] of projectReport.extern.entries()) {
			const childIndex = this.index.getModuleIndexByID(moduleID)
			if (childIndex === undefined) {
				throw new Error('SourceFileMetaDataTree.addExternReport: could not resolve module index')
			}
			this.addExternReport(externModuleReport, childIndex, mode)
		}
	}
}