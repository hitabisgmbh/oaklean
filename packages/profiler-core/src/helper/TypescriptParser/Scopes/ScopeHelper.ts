import * as ts from 'typescript'

import { IfStatementHelper } from './IfStatementHelper'
import { SwitchStatementHelper } from './SwitchStatementHelper'
import { TryStatementHelper } from './TryStatementHelper'

import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import { ProgramStructureTreeTypeIntermediateScope } from '../../../types'

type ParseIntermediateFunction = (
	node: ts.Node,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) =>
	| {
			resolve(): ProgramStructureTree<ProgramStructureTreeTypeIntermediateScope>
	  }
	| undefined

const PARSE_INTERMEDIATE_NODE: Partial<Record<ts.SyntaxKind, ParseIntermediateFunction>> = {
	[ts.SyntaxKind.IfStatement]: IfStatementHelper.ifCase,
	[ts.SyntaxKind.CaseBlock]: SwitchStatementHelper.switchCase,
	[ts.SyntaxKind.TryStatement]: TryStatementHelper.tryCatchFinally
}

const INTERMEDIATE_NODE_PARENT_TYPE = new Set([
	ts.SyntaxKind.IfStatement,
	ts.SyntaxKind.CaseBlock,
	ts.SyntaxKind.TryStatement
])

export class ScopeHelper {
	static parseIntermediateNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeTypeIntermediateScope> } | undefined {
		const parseFunction = PARSE_INTERMEDIATE_NODE[node.parent?.kind]
		if (parseFunction !== undefined) {
			return parseFunction(node, node.parent, sourceFile, traverseNodeInfo)
		}
	}

	static isIntermediateNode(node: ts.Node) {
		return INTERMEDIATE_NODE_PARENT_TYPE.has(node.parent?.kind)
	}
}
