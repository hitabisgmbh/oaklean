import { SourceNodeIndex } from './SourceNodeIndex'
import { GlobalIndex } from './GlobalIndex'
import { ModuleIndex } from './ModuleIndex'

import { BaseModel } from '../BaseModel'
import { ModelMap } from '../ModelMap'
import { SourceNodeIdentifierHelper } from '../../helper/SourceNodeIdentifierHelper'
import { UnifiedPath } from '../../system/UnifiedPath'
import { LangInternalPathRegex } from '../../constants/SourceNodeRegex'
// Types
import {
	PathID_number,
	IPathIndex,
	UnifiedPath_string,
	UnifiedPathPart_string,
	IndexRequestType,
	SourceNodeID_number,
	SourceNodeIndexType,
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string,
	LangInternalPath_string,
	LangInternalSourceNodeIdentifier_string
} from '../../types'
export class PathIndex extends BaseModel {
	moduleIndex: ModuleIndex
	identifier: UnifiedPath_string | LangInternalPath_string
	sourceNodeMap: ModelMap<
	SourceNodeIdentifier_string | LangInternalSourceNodeIdentifier_string,
	SourceNodeIndex<SourceNodeIndexType.SourceNode>>

	reverseSourceNodeMap: ModelMap<
	SourceNodeID_number,
	SourceNodeIndex<SourceNodeIndexType.SourceNode>>

	private _id?: PathID_number
	children?: ModelMap<UnifiedPathPart_string, PathIndex>
	file?: ModelMap<SourceNodeIdentifierPart_string, SourceNodeIndex<SourceNodeIndexType>>

	constructor(
		identifier: UnifiedPath_string | LangInternalPath_string,
		moduleIndex: ModuleIndex,
		id?: PathID_number
	) {
		super()
		this.identifier = identifier
		this.moduleIndex = moduleIndex
		this._id = id
		this.sourceNodeMap = new ModelMap<
		SourceNodeIdentifier_string | LangInternalSourceNodeIdentifier_string,
		SourceNodeIndex<SourceNodeIndexType.SourceNode>>('string')

		this.reverseSourceNodeMap = new ModelMap<
		SourceNodeID_number,
		SourceNodeIndex<SourceNodeIndexType.SourceNode>>('number')
	}

	private _containsUncommittedChanges?: boolean
	public get containsUncommittedChanges(): boolean {
		return this._containsUncommittedChanges === undefined ? false : true
	}

	public set containsUncommittedChanges(v: boolean) {
		this._containsUncommittedChanges = v === true ? true : undefined
	}

	insertToOtherIndex(globalIndex: GlobalIndex): PathIndex {
		const newModuleIndex = this.moduleIndex.insertToOtherIndex(globalIndex)
		return newModuleIndex.getFilePathIndex('upsert', this.identifier)
	}

	toBuffer(): Buffer {
		throw new Error('PathIndex.toBuffer: not yet implemented')
	}

	sourceNodeIDs(): SourceNodeID_number[] {
		return Array.from(this.reverseSourceNodeMap.keys())
	}

	addToSourceNodeMap(sourceNodeIndex: SourceNodeIndex<SourceNodeIndexType.SourceNode>) {
		this.sourceNodeMap.set(sourceNodeIndex.identifier, sourceNodeIndex)
		this.reverseSourceNodeMap.set(sourceNodeIndex.id, sourceNodeIndex)
	}

	public set id(id: PathID_number | undefined) {
		this._id = id
	}
	
	public get id(): PathID_number | undefined {
		return this._id
	}

	public get pathId(): PathID_number | undefined {
		return this._id as PathID_number | undefined
	}

	selfAssignId() {
		this.id = this.moduleIndex.globalIndex.newId(
			this,
			'path'
		) as PathID_number
		this.moduleIndex.addToPathMap(this)
	}

	toJSON(): IPathIndex {
		const containsUncommittedChanges = this.containsUncommittedChanges ? { cucc: true } : {}

		return {
			id: this._id,
			children: this.children?.toJSON(),
			file: this.file?.toJSON(),
			...containsUncommittedChanges
		}
	}

	static fromJSON(
		json: string | IPathIndex,
		pathParts: string[],
		moduleIndex: ModuleIndex
	): PathIndex {
		let data: IPathIndex
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		let identifier
		if (pathParts[0] === '' || LangInternalPathRegex.test(pathParts[0])) {
			identifier = pathParts.join('/') as LangInternalPath_string
		} else {
			identifier = UnifiedPath.fromPathParts(pathParts).toString()
		}

		const result = new PathIndex(identifier, moduleIndex)
		result._id = data.id
		result.containsUncommittedChanges = data.cucc === undefined ? false : true

		if (data.children) {
			result.children = new ModelMap<UnifiedPathPart_string, PathIndex>('string')
			for (const key of Object.keys(data.children) as UnifiedPathPart_string[]) {
				result.children.set(
					key,
					PathIndex.fromJSON(data.children[key], [...pathParts, key], moduleIndex)
				)
			}
		}

		if (data.file) {
			result.file = new ModelMap<SourceNodeIdentifierPart_string, SourceNodeIndex<SourceNodeIndexType>>('string')
			for (const key of Object.keys(data.file) as SourceNodeIdentifierPart_string[]) {
				result.file.set(
					key,
					SourceNodeIndex.fromJSON(
						data.file[key],
						[key],
						result,
						data.file[key].id === undefined ?
							SourceNodeIndexType.Intermediate :
							SourceNodeIndexType.SourceNode
					)
				)
			}
		}
		const id = result._id
		if (id !== undefined) {
			moduleIndex.addToPathMap(result)
			moduleIndex.globalIndex.setReverseIndex(
				id,
				result,
				'path'
			)
		}

		return result
	}

	getSourceNodeIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ?
			SourceNodeIndex<SourceNodeIndexType.SourceNode> :
			(SourceNodeIndex<SourceNodeIndexType.SourceNode> | undefined)
	>(
		indexRequestType: T,
		sourceNodeIdentifier: SourceNodeIdentifier_string
	): R {
		const indexFromSourceNodeMap = this.sourceNodeMap.get(sourceNodeIdentifier)
		if (indexFromSourceNodeMap !== undefined) {
			return indexFromSourceNodeMap as R
		}

		let currentSourceNodeIndex: SourceNodeIndex<SourceNodeIndexType> | undefined
		let currentSourceNodeMap: ModelMap<
		SourceNodeIdentifierPart_string,
		SourceNodeIndex<SourceNodeIndexType>
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		> = this.file!

		const sourceNodeIdentifierParts = SourceNodeIdentifierHelper.split(sourceNodeIdentifier)
		for (let i = 0; i < sourceNodeIdentifierParts.length; i++) {
			let sourceNodeIndex: SourceNodeIndex<SourceNodeIndexType> | undefined =
				currentSourceNodeMap.get(sourceNodeIdentifierParts[i])

			if (sourceNodeIndex === undefined) {
				switch (indexRequestType) {
					case 'get':
						return undefined as R
					case 'upsert':
						sourceNodeIndex = new SourceNodeIndex(
							SourceNodeIdentifierHelper.join(sourceNodeIdentifierParts.slice(0, i+1)),
							this,
							SourceNodeIndexType.Intermediate
						)
						currentSourceNodeMap.set(sourceNodeIdentifierParts[i], sourceNodeIndex)
						break
					default:
						return undefined as R
				}
			}

			if (i === sourceNodeIdentifierParts.length - 1) {
				if (sourceNodeIndex.id === undefined) {
					switch (indexRequestType) {
						case 'get':
							return undefined as R
						case 'upsert':
							sourceNodeIndex.type = SourceNodeIndexType.SourceNode
							sourceNodeIndex.selfAssignId()
							break
						default:
							return undefined as R
					}
				}
				currentSourceNodeIndex = sourceNodeIndex
			} else {
				if (sourceNodeIndex.children === undefined) {
					switch (indexRequestType) {
						case 'get':
							return undefined as R
						case 'upsert':
							sourceNodeIndex.children = new ModelMap<
							SourceNodeIdentifierPart_string,
							SourceNodeIndex<SourceNodeIndexType>
							>('string')
							break
						default:
							return undefined as R
					}
				}
				currentSourceNodeMap = sourceNodeIndex.children
			}
		}
		return currentSourceNodeIndex as R
	}
}