import * as fs from 'fs'

import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'

import { UnifiedPath } from '../system'
import { PermissionHelper } from '../helper/PermissionHelper'
import { SourceNodeIdentifierHelper } from '../helper/SourceNodeIdentifierHelper'
// Types
import {
	ProgramStructureTreeType,
	PSTIdentifierHierarchy,
	IdentifierType,
	NodeLocation,
	NodeLocationRange,
	IProgramStructureTree,
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string
} from '../types'

export class ProgramStructureTree<T extends ProgramStructureTreeType = ProgramStructureTreeType> extends BaseModel {
	id: number
	type: T
	identifierType: IdentifierType
	identifier: SourceNodeIdentifierPart_string
	beginLoc: NodeLocation
	endLoc: NodeLocation
	children: ModelMap<SourceNodeIdentifierPart_string, ProgramStructureTree>
	parent: T extends ProgramStructureTreeType.Root ? null : ProgramStructureTree

	private identifierBySourceLocationCache: Map<string, SourceNodeIdentifier_string>
	private containsLocationCache: Map<string, boolean>
	private sourceLocationOfIdentifierCache: Map<SourceNodeIdentifier_string, NodeLocationRange | null>

	constructor(
		parent: T extends ProgramStructureTreeType.Root ?
			null :
			ProgramStructureTree,
		id: number,
		type: T,
		identifierType: IdentifierType,
		identifier: SourceNodeIdentifierPart_string,
		beginLoc: NodeLocation,
		endLoc: NodeLocation
	) {
		super()
		if (!SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(identifier)) {
			throw new Error('ProgramStructureTree.constructor invalid identifier format: ' + identifier)
		}

		this.parent = parent
		this.id = id
		this.type = type
		this.identifierType = identifierType
		this.identifier = identifier
		this.beginLoc = beginLoc
		this.endLoc = endLoc
		this.children = new ModelMap<SourceNodeIdentifierPart_string, ProgramStructureTree>('string')

		// Cache initialization
		this.identifierBySourceLocationCache = new Map()
		this.containsLocationCache = new Map()
		this.sourceLocationOfIdentifierCache = new Map()
	}

	numberOfLeafs(): number {
		const traverse = (currentNode: ProgramStructureTree): number => {
			if (currentNode.children.size === 0) {
				if (currentNode.type === ProgramStructureTreeType.Root) {
					return 0
				}
				return 1
			}
			let count = 0
			for (const child of currentNode.children.values()) {
				count += traverse(child)
			}
			return count
		}

		return 	traverse(this)
	}

	/**
	 * Returns the identifier path of the current node.
	 */
	identifierPath(): SourceNodeIdentifier_string {
		if (this.parent === null) {
			return this.identifier as unknown as SourceNodeIdentifier_string
		}
		return (this.parent.identifierPath() + '.' + this.identifier) as SourceNodeIdentifier_string
	}

	identifierHierarchy(): PSTIdentifierHierarchy {
		const traverse = (currentNode: ProgramStructureTree): PSTIdentifierHierarchy => {
			const result: PSTIdentifierHierarchy = {
				type: currentNode.type
			}
			for (const [childIdentifier, child] of currentNode.children.entries()) {
				const children = result.children || {}
				children[childIdentifier] = traverse(child)
				result.children = children
			}
			return result
		}

		return traverse(this)
	}

	toJSON(): IProgramStructureTree {
		return {
			id: this.id,
			type: this.type,
			identifierType: this.identifierType,
			identifier: this.identifier,
			beginLoc: this.beginLoc,
			endLoc: this.endLoc,
			children: this.children.toJSON<IProgramStructureTree>() || {}
		}
	}

	storeToFile(filePath: UnifiedPath) {
		PermissionHelper.writeFileWithUserPermission(
			filePath,
			JSON.stringify(this, null, 2)
		)
	}

	static loadFromFile(
		filePath: UnifiedPath
	): ProgramStructureTree | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return ProgramStructureTree.fromJSON(
			fs.readFileSync(filePath.toPlatformString()).toString()
		)
	}


	static fromJSON(json: string | IProgramStructureTree): ProgramStructureTree {
		return ProgramStructureTree.fromJSONWithParent(json, null)
	}

	static fromJSONWithParent(
		json: string | IProgramStructureTree,
		parent: ProgramStructureTree | null
	): ProgramStructureTree {
		let data: IProgramStructureTree
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new ProgramStructureTree(
			parent,
			data.id,
			data.type,
			data.identifierType,
			data.identifier,
			data.beginLoc,
			data.endLoc
		)

		for (const key of Object.keys(data.children) as SourceNodeIdentifierPart_string[]) {
			result.children.set(key, ProgramStructureTree.fromJSON(data.children[key]))
		}

		return result
	}

	containsLocation(loc: NodeLocation) {
		const lookupKey = `${loc.line}:${loc.column}`
		const cacheResult = this.containsLocationCache.get(lookupKey)
		if (cacheResult !== undefined) {
			return cacheResult
		}
		if (loc.line >= this.beginLoc.line && loc.line <= this.endLoc.line) {
			if (loc.line === this.beginLoc.line && loc.column < this.beginLoc.column) {
				this.containsLocationCache.set(lookupKey, false)
				return false
			}
			if (loc.line === this.endLoc.line && loc.column > this.endLoc.column) {
				this.containsLocationCache.set(lookupKey, false)
				return false
			}
			this.containsLocationCache.set(lookupKey, true)
			return true
		}
		this.containsLocationCache.set(lookupKey, false)
		return false
	}

	identifierNodeBySourceLocation(targetLoc: NodeLocation): {
		identifier: SourceNodeIdentifier_string,
		node: ProgramStructureTree
	} | undefined {
		const traverse = (
			identifier: SourceNodeIdentifier_string,
			currentNode: ProgramStructureTree
		): {
			identifier:	SourceNodeIdentifier_string,
			node: ProgramStructureTree
		} => {
			for (const [childIdentifier, child] of currentNode.children.entries()) {
				if (child.containsLocation(targetLoc)) {
					return traverse((identifier + '.' + childIdentifier) as SourceNodeIdentifier_string, child)
				}
			}
			return {
				identifier,
				node: currentNode
			}
		}

		if (this.containsLocation(targetLoc)) {
			return traverse(this.identifier as unknown as SourceNodeIdentifier_string, this)
		}
		if (this.type === ProgramStructureTreeType.Root) {
			if (targetLoc.line <= this.beginLoc.line && targetLoc.line <= this.endLoc.line) {
				return {
					// treat as root node if its before the root node
					identifier: this.identifier as unknown as SourceNodeIdentifier_string,
					node: this
				}
			}
		}
		return undefined
	}

	identifierBySourceLocation(targetLoc: NodeLocation): SourceNodeIdentifier_string {
		const lookupKey = `${targetLoc.line}:${targetLoc.column}`
		const cacheResult = this.identifierBySourceLocationCache.get(lookupKey)
		if (cacheResult !== undefined) {
			return cacheResult
		}
		const { identifier } = this.identifierNodeBySourceLocation(targetLoc) || {
			identifier: '' as SourceNodeIdentifier_string
		}
		this.identifierBySourceLocationCache.set(lookupKey, identifier)
		return identifier
	}

	sourceLocationOfIdentifier(identifier: SourceNodeIdentifier_string): NodeLocationRange | null {
		const cacheResult = this.sourceLocationOfIdentifierCache.get(identifier)
		if (cacheResult !== undefined) {
			return cacheResult
		}
		
		const traverse = (identifierStack: SourceNodeIdentifierPart_string[], currentNode: ProgramStructureTree):
		NodeLocationRange | null => {
			if (identifierStack[0] === currentNode.identifier) {
				if (identifierStack.length === 1) {
					return {
						beginLoc: currentNode.beginLoc,
						endLoc: currentNode.endLoc
					}
				}

				const shiftedIdentifierStack = identifierStack.slice(1)
				for (const child of currentNode.children.values()) {
					const result = traverse(shiftedIdentifierStack, child)
					if (result) {
						return result
					}
				}
			}
			return null
		}
		
		const identifierStack = SourceNodeIdentifierHelper.split(identifier)
		const result = traverse(identifierStack, this)
		this.sourceLocationOfIdentifierCache.set(identifier, result)
		return result
	}
}