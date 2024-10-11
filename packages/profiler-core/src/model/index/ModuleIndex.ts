import { PathIndex } from './PathIndex'
import { GlobalIndex } from './GlobalIndex'
import { SourceNodeIndex } from './SourceNodeIndex'

import { BaseModel } from '../BaseModel'
import { ModelMap } from '../ModelMap'
import { UnifiedPath } from '../../system/UnifiedPath'
import { NodeModule } from '../NodeModule'
// Types
import {
	PathID_number,
	IndexRequestType,
	SourceNodeIndexType,
	UnifiedPath_string,
	LangInternalPath_string,
	NodeModuleIdentifier_string,
	ModuleID_number,
	IModuleIndex
} from '../../types'

export class ModuleIndex extends BaseModel {
	globalIndex: GlobalIndex
	identifier: NodeModuleIdentifier_string
	pathMap: ModelMap<UnifiedPath_string | LangInternalPath_string, PathIndex>
	reversePathMap: ModelMap<PathID_number, PathIndex>

	private _id: ModuleID_number
	children: ModelMap<string, PathIndex>

	constructor(
		identifier: NodeModuleIdentifier_string,
		globalIndex: GlobalIndex,
		id?: ModuleID_number
	) {
		super()
		this.children = new ModelMap<string, PathIndex>('string')
		this.identifier = identifier
		this.globalIndex = globalIndex
		this._id = id !== undefined ? id : globalIndex.newId(this, 'module') as ModuleID_number
		this.pathMap = new ModelMap<UnifiedPath_string | LangInternalPath_string, PathIndex>('string')
		this.reversePathMap = new ModelMap<PathID_number, PathIndex>('number')
	}

	insertToOtherIndex(globalIndex: GlobalIndex): ModuleIndex {
		return globalIndex.getModuleIndex('upsert', this.identifier)
	}

	addToPathMap(pathIndex: PathIndex) {
		if (pathIndex.id === undefined) {
			throw new Error('ModuleIndex.addToPathMap: given pathIndex has no id')
		}
		this.pathMap.set(pathIndex.identifier, pathIndex)
		this.reversePathMap.set(pathIndex.id, pathIndex)
	}

	public get id(): ModuleID_number {
		return this._id as ModuleID_number
	}

	toBuffer(): Buffer {
		throw new Error('ModuleIndex.toBuffer: not yet implemented')
	}

	toJSON() {
		return {
			id: this.id,
			children: this.children.toJSON()
		}
	}

	static fromJSON(
		json: string | IModuleIndex,
		identifier: NodeModuleIdentifier_string,
		globalIndex: GlobalIndex
	): ModuleIndex {
		let data: IModuleIndex
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new ModuleIndex(identifier, globalIndex, data.id)
		result.children = new ModelMap<string, PathIndex>('string')

		const id = result.id
		if (id !== undefined) {
			globalIndex.setReverseIndex(
				id,
				result,
				'module'
			)
		}
		if (data.children !== undefined) {
			for (const key of Object.keys(data.children)) {
				result.children.set(
					key,
					PathIndex.fromJSON(data.children[key], [key], result)
				)
			}
		}

		return result
	}

	getFilePathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : (PathIndex | undefined)
	>(
		indexRequestType: T,
		filePath: UnifiedPath_string | LangInternalPath_string
	): R {
		const indexFromPathMap = this.pathMap.get(filePath)
		if (indexFromPathMap !== undefined) {
			return indexFromPathMap as R
		}

		let currentPathIndex: PathIndex | undefined
		let currentPathMap: ModelMap<string, PathIndex> = this.children

		const path = new UnifiedPath(filePath)
		const pathParts = path.split()
		for (let i = 0; i < pathParts.length; i++) {
			let pathIndex: PathIndex | undefined = currentPathMap.get(pathParts[i])

			if (pathIndex === undefined) {
				switch (indexRequestType) {
					case 'get':
						return undefined as R
					case 'upsert': {
						let slicedPath = new UnifiedPath('./').join(...pathParts.slice(0, i + 1)).toString()
						if (slicedPath.startsWith('./node:') || slicedPath === './') {
							slicedPath = slicedPath.slice(2) as UnifiedPath_string
						}
						pathIndex = new PathIndex(
							slicedPath,
							this
						)
						currentPathMap.set(pathParts[i], pathIndex)
					} break
					default:
						return undefined as R
				}
			}

			if (i === pathParts.length - 1) {
				if (pathIndex.id === undefined) {
					switch (indexRequestType) {
						case 'get':
							return undefined as R
						case 'upsert':
							pathIndex.selfAssignId()
							if (pathIndex.file === undefined) {
								pathIndex.file = new ModelMap<string, SourceNodeIndex<SourceNodeIndexType>>('string')
							}
							break
						default:
							return undefined as R
					}
				}
				currentPathIndex = pathIndex
			} else {
				if (pathIndex.children === undefined) {
					switch (indexRequestType) {
						case 'get':
							return undefined as R
						case 'upsert':
							pathIndex.children = new ModelMap<string, PathIndex>('string')
							break
						default:
							return undefined as R
					}
				}
				currentPathMap = pathIndex.children
			}
		}

		return currentPathIndex as R
	}

	nodeModule(): NodeModule | undefined{
		if (this.identifier !== '{self}' && this.identifier !== '{node}') {
			return NodeModule.fromIdentifier(this.identifier as NodeModuleIdentifier_string)
		}
		return undefined
	}
}