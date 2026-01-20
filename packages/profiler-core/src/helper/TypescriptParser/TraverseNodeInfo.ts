import * as ts from 'typescript'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
import { UnifiedPath } from '../../system/UnifiedPath'
// Types
import { UnifiedPath_string } from '../../types'

export type TraverseNodeInfoCounters = {
	childrenCounter: number

	switchCounter: number
	ifStatementCounter: number
	forStatementCounter: number
	whileStatementCounter: number
	tryStatementCounter: number
	blockCounter: number
	staticBlockCounter: number
	anonymousFunctionCounter: number
}

export class TraverseNodeInfo {
	private _root: TraverseNodeInfo
	public parent: TraverseNodeInfo | null
	public node: ts.Node
	public filePath: UnifiedPath | UnifiedPath_string
	private _idCounter: number
	public tree:
		| ProgramStructureTree
		| {
				resolve(): ProgramStructureTree
				resolveWithNoChildren?: boolean
		  }
	public counters: TraverseNodeInfoCounters

	private _moduleIdentificationCounter?: Map<string, number>
	get moduleIdentificationCounter(): Map<string, number> {
		if (this._moduleIdentificationCounter !== undefined) {
			return this._moduleIdentificationCounter
		}
		this._moduleIdentificationCounter = new Map<string, number>()
		return this._moduleIdentificationCounter
	}

	requestModuleIdentificationCounter(identifier: string): number {
		const currentCount = this.moduleIdentificationCounter.get(identifier) ?? 0
		this.moduleIdentificationCounter.set(identifier, currentCount + 1)
		return currentCount
	}

	shouldResolveTreeWithZeroChildren(): boolean {
		return this.tree instanceof ProgramStructureTree || this.tree.resolveWithNoChildren === true
	}

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
		tree: ProgramStructureTree | { resolve(): ProgramStructureTree }
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
			forStatementCounter: 0,
			whileStatementCounter: 0,
			tryStatementCounter: 0,
			blockCounter: 0,
			staticBlockCounter: 0,
			anonymousFunctionCounter: 0
		}
	}
}
