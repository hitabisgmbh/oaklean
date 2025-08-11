import * as ts from 'typescript'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
import { UnifiedPath } from '../../system/UnifiedPath'
// Types
import {
	UnifiedPath_string,
} from '../../types'


export type TraverseNodeInfoCounters = {
	childrenCounter: number

	switchCounter: number
	ifStatementCounter: number
	anonymousFunctionCounter: number
}

export class TraverseNodeInfo {
	private _root: TraverseNodeInfo
	public parent: TraverseNodeInfo | null
	public node: ts.Node
	public filePath: UnifiedPath | UnifiedPath_string
	private _idCounter: number
	public tree: ProgramStructureTree | { resolve: () => ProgramStructureTree }
	public counters: TraverseNodeInfoCounters

	isTreeResolved(): boolean {
		return this.tree instanceof ProgramStructureTree
	}

	resolvedTree(): ProgramStructureTree {
		if (this.tree instanceof ProgramStructureTree) {
			return this.tree
		}
		const tree = this.tree.resolve()
		this.tree = tree
		return tree
	}

	get root(): TraverseNodeInfo {
		return this._root
	}

	nextId() {
		return this._root._idCounter++
	}

	constructor(
		parent: TraverseNodeInfo | null = null,
		node: ts.Node,
		filePath: UnifiedPath | UnifiedPath_string,
		tree: ProgramStructureTree | { resolve: () => ProgramStructureTree }
	) {
		this.parent = parent
		this._idCounter = 1 // root node has id 0
		if (this.parent === null) {
			this._root = this
		} else {
			this._root = this.parent._root
		}
		this.node = node
		this.filePath = filePath
		this.tree = tree

		this.counters = {
			childrenCounter: 0,
			switchCounter: 0,
			ifStatementCounter: 0,
			anonymousFunctionCounter: 0
		}
	}
}