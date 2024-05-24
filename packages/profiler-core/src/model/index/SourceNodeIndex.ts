import { PathIndex } from './PathIndex'
import { GlobalIndex } from './GlobalIndex'

import { BaseModel } from '../BaseModel'
import { ModelMap } from '../ModelMap'
import { GlobalIdentifier } from '../../system/GlobalIdentifier'
import { UnifiedPath_string } from '../../types/UnifiedPath.types'
import { SourceNodeIdentifier_string } from '../../types/SourceNodeIdentifiers.types'
import { LangInternalSourceNodeIdentifier_string } from '../../types/SourceNodeIdentifiers.types'

const SourceNodeIDSymbol: unique symbol = Symbol('SourceNodeIDSymbol')
export type SourceNodeID_number = number & { [SourceNodeIDSymbol]: never }

export enum SourceNodeIndexType {
	Intermediate = 0,
	SourceNode = 1
}
type SourceNodeIndexID<T> = T extends SourceNodeIndexType.SourceNode ? SourceNodeID_number : undefined

export interface ISourceNodeIndex<
	T extends SourceNodeIndexType = SourceNodeIndexType.Intermediate
> {
	id: SourceNodeIndexID<T>
	children?: Record<string, ISourceNodeIndex<SourceNodeIndexType>>,
	npiosc?: boolean // not present in original source code 
}

export class SourceNodeIndex<T extends SourceNodeIndexType> extends BaseModel {
	identifier: SourceNodeIdentifier_string | LangInternalSourceNodeIdentifier_string

	private _id: SourceNodeIndexID<T>
	children?: ModelMap<string, SourceNodeIndex<SourceNodeIndexType>>

	type: T
	pathIndex: PathIndex

	constructor(
		identifier: SourceNodeIdentifier_string | LangInternalSourceNodeIdentifier_string,
		pathIndex: PathIndex,
		type: T,
		id?: SourceNodeIndexID<T>
	) {
		super()
		this.identifier = identifier
		this.pathIndex = pathIndex
		this.type = type
		this._id = (
			this.isSourceNode() ? ((id === undefined) ? this.selfAssignId() : id) : undefined
		) as SourceNodeIndexID<T>
	}

	private _notPresentInOriginalSourceCode?: boolean
	public get presentInOriginalSourceCode() : boolean {
		return this._notPresentInOriginalSourceCode === undefined ? true : false
	}

	public set presentInOriginalSourceCode(v : boolean) {
		this._notPresentInOriginalSourceCode = v === true ? undefined : true
	}

	insertToOtherIndex(globalIndex: GlobalIndex): SourceNodeIndex<SourceNodeIndexType.SourceNode> {
		const newPathIndex = this.pathIndex.insertToOtherIndex(globalIndex)
		return newPathIndex.getSourceNodeIndex('upsert', this.identifier)
	}

	toBuffer(): Buffer {
		throw new Error('SourceNodeIndex.toBuffer: not yet implemented')
	}

	isSourceNode(): this is SourceNodeIndex<SourceNodeIndexType.SourceNode> {
		return this.type === SourceNodeIndexType.SourceNode
	}

	// make selfAssignId only available for instances of type SourceNodeIndex<SourceNodeIndexType.SourceNode>
	selfAssignId: T extends SourceNodeIndexType.SourceNode
		? () => SourceNodeIndexID<T> : never = (() => {
			if (!this.isSourceNode()) {
				throw new Error('SourceNodeIndex.selfAssignId: can only be called on a SourceNodeIndex of type SourceNode')
			}
			const self = this as SourceNodeIndex<SourceNodeIndexType.SourceNode>
			self._id = this.pathIndex.moduleIndex.globalIndex.newId(
				this as SourceNodeIndex<SourceNodeIndexType.SourceNode>,
				'sourceNode'
			) as SourceNodeID_number
			self.pathIndex.addToSourceNodeMap(this)
			return this._id as SourceNodeIndexID<T>
		}) as any

	public get id(): SourceNodeIndexID<T> {
		return this._id as SourceNodeIndexID<T>
	}

	toJSON(): ISourceNodeIndex<T> {
		const presentInOriginalSourceCode = this.presentInOriginalSourceCode ? {} : { npiosc: true }

		return {
			id: this.id,
			...presentInOriginalSourceCode,
			children: this.children?.toJSON()
		}
	}

	static fromJSON<T extends SourceNodeIndexType>(
		json: string | ISourceNodeIndex<T>,
		sourceNodeParts: string[],
		pathIndex: PathIndex,
		type: T
	): SourceNodeIndex<T> {
		let data: ISourceNodeIndex<T>
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new SourceNodeIndex<T>(
			sourceNodeParts.join('.') as SourceNodeIdentifier_string,
			pathIndex,
			type,
			data.id
		)
		result.presentInOriginalSourceCode = data.npiosc === undefined ? true : false
		if (result.isSourceNode()) {
			result.pathIndex.addToSourceNodeMap(result)
			result.pathIndex.moduleIndex.globalIndex.setReverseIndex(
				result.id,
				result,
				'sourceNode'
			)
		}

		if (data.children) {
			result.children = new ModelMap<string, SourceNodeIndex<SourceNodeIndexType>>('string')
			for (const key of Object.keys(data.children)) {
				result.children.set(
					key,
					SourceNodeIndex.fromJSON(
						data.children[key],
						[...sourceNodeParts, key],
						pathIndex,
						data.children[key].id !== undefined
							? SourceNodeIndexType.SourceNode : SourceNodeIndexType.Intermediate
					)
				)
			}
		}

		return result
	}

	globalIdentifier(): GlobalIdentifier {
		const isLangInternal =
			this.pathIndex.moduleIndex === this.pathIndex.moduleIndex.globalIndex.getLangInternalIndex('get')

		return new GlobalIdentifier(
			this.pathIndex.identifier as UnifiedPath_string,
			this.identifier as SourceNodeIdentifier_string,
			isLangInternal ?
				this.pathIndex.moduleIndex.globalIndex.engineModule :
				this.pathIndex.moduleIndex.nodeModule()
		)
	}
}