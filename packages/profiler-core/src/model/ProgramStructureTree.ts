import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import { validateSourceNodeIdentifier } from './SourceNodeMetaData'

import { memoize } from '../helper/memoize'
// Types
import {
	ProgramStructureTreeType,
	IdentifierType,
	NodeLocation,
	NodeLocationRange,
	IProgramStructureTree,
	SourceNodeIdentifier_string
} from '../types'


export class ProgramStructureTree extends BaseModel {
	id: number
	type: ProgramStructureTreeType
	identifierType: IdentifierType
	identifier: SourceNodeIdentifier_string
	beginLoc: NodeLocation
	endLoc: NodeLocation
	children: ModelMap<string, ProgramStructureTree>

	constructor(
		id: number,
		type: ProgramStructureTreeType,
		identifierType: IdentifierType,
		identifier: SourceNodeIdentifier_string,
		beginLoc: NodeLocation,
		endLoc: NodeLocation
	) {
		super()
		if (!validateSourceNodeIdentifier(identifier)) {
			throw new Error('ProgramStructureTree.constructor invalid identifier format: ' + identifier)
		}

		this.id = id
		this.type = type
		this.identifierType = identifierType
		this.identifier = identifier
		this.beginLoc = beginLoc
		this.endLoc = endLoc
		this.children = new ModelMap<string, ProgramStructureTree>('string')

		this.containsLocation = memoize(this.containsLocation.bind(this))
		this.identifierBySourceLocation = memoize(this.identifierBySourceLocation.bind(this))
		this.sourceLocationOfIdentifier = memoize(this.sourceLocationOfIdentifier.bind(this))
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

	static fromJSON(json: string | IProgramStructureTree): ProgramStructureTree {
		let data: IProgramStructureTree
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new ProgramStructureTree(
			data.id,
			data.type,
			data.identifierType,
			data.identifier,
			data.beginLoc,
			data.endLoc
		)

		for (const key of Object.keys(data.children)) {
			result.children.set(key, ProgramStructureTree.fromJSON(data.children[key]))
		}

		return result
	}

	containsLocation(loc: NodeLocation) {
		if (loc.line >= this.beginLoc.line && loc.line <= this.endLoc.line) {
			if (loc.line === this.beginLoc.line && loc.column < this.beginLoc.column) {
				return false
			}
			if (loc.line === this.endLoc.line && loc.column > this.endLoc.column) {
				return false
			}
			return true
		}
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
			return traverse(this.identifier, this)
		}
		if (this.type === ProgramStructureTreeType.Root) {
			if (targetLoc.line <= this.beginLoc.line && targetLoc.line <= this.endLoc.line) {
				return {
					identifier: this.identifier, // treat as root node if its before the root node
					node: this
				}
			}
		}
		return undefined
	}

	identifierBySourceLocation(targetLoc: NodeLocation): SourceNodeIdentifier_string {
		const { identifier } = this.identifierNodeBySourceLocation(targetLoc) || {
			identifier: '' as SourceNodeIdentifier_string
		}
		return identifier
	}

	sourceLocationOfIdentifier(identifier: SourceNodeIdentifier_string): NodeLocationRange | undefined{
		const traverse = (identifierStack: string[], currentNode: ProgramStructureTree):
		NodeLocationRange | undefined => {
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
			return undefined
		}
		
		const identifierStack = identifier.split('.')
		return traverse(identifierStack, this)
	}
}