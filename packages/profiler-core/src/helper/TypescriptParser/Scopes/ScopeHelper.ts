import * as ts from 'typescript'

import { IfStatementHelper } from './IfStatementHelper'
import { SwitchStatementHelper } from './SwitchStatementHelper'

import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeTypeScope
} from '../../../types'

type ParseIntermediateFunction = (
	node: ts.Node,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => {
	resolve(): ProgramStructureTree<ProgramStructureTreeTypeScope>
} | undefined

const PARSE_INTERMEDIATE_NODE: Partial<Record<ts.SyntaxKind, ParseIntermediateFunction>> = {
	[ts.SyntaxKind.IfStatement]: IfStatementHelper.ifCase,
	[ts.SyntaxKind.CaseBlock]: SwitchStatementHelper.switchCase,
}

const INTERMEDIATE_NODE_PARENT_TYPE = new Set([
	ts.SyntaxKind.IfStatement,
	ts.SyntaxKind.CaseBlock
])

export class ScopeHelper {
	static parseIntermediateNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeTypeScope> } | undefined {
		const parseFunction = PARSE_INTERMEDIATE_NODE[node.parent?.kind]
		if (parseFunction !== undefined) {
			return parseFunction(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}
	}

	static isIntermediateNode(
		node: ts.Node
	) {
		return INTERMEDIATE_NODE_PARENT_TYPE.has(node.parent?.kind)
	}
}
