import * as ts from 'typescript'

import { IfStatementHelper } from './IfStatementHelper'
import { SwitchStatementHelper } from './SwitchStatementHelper'

import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeType,
	ProgramStructureTreeTypeScope
} from '../../../types'

type ClearEmptyScopesFunction = (traverseNodeInfo: TraverseNodeInfo) => void

const CLEAR_EMPTY_SCOPES: Partial<Record<ProgramStructureTreeType, ClearEmptyScopesFunction | null>> = {
	[ProgramStructureTreeType.ObjectLiteralExpression]: null, 
	[ProgramStructureTreeType.IfStatement]: IfStatementHelper.clearEmptyScopes,
	[ProgramStructureTreeType.IfThenStatement]: null,
	[ProgramStructureTreeType.IfElseStatement]: null,
	[ProgramStructureTreeType.SwitchStatement]: SwitchStatementHelper.clearEmptyScopes,
	[ProgramStructureTreeType.SwitchCaseClause]: null,
}

type ParseIntermediateFunction = (
	node: ts.Node,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeTypeScope> | undefined

const PARSE_INTERMEDIATE_NODE: Partial<Record<ts.SyntaxKind, ParseIntermediateFunction>> = {
	[ts.SyntaxKind.IfStatement]: IfStatementHelper.ifCase,
	[ts.SyntaxKind.CaseBlock]: SwitchStatementHelper.switchCase,
}

export class ScopeHelper {
	static intermediateNodeParentTypes = new Set([
		ts.SyntaxKind.IfStatement,
		ts.SyntaxKind.CaseBlock
	])

	static clearEmptyScopes(
		traverseNodeInfo: TraverseNodeInfo
	) {
		if (
			traverseNodeInfo.tree.children.size === 0
		) {
			const clearEmptyScopeFunction = CLEAR_EMPTY_SCOPES[traverseNodeInfo.tree.type]
			if (clearEmptyScopeFunction !== undefined) {
				if (clearEmptyScopeFunction !== null) {
					clearEmptyScopeFunction(traverseNodeInfo)
				}
				// remove empty scopes since scopes are only used as a hierarchy level to distinguish between
				// functions, methods, etc.
				traverseNodeInfo.tree.parent?.children.delete(traverseNodeInfo.tree.identifier)
			}
		}
	}

	static parseIntermediateNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
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
		return ScopeHelper.intermediateNodeParentTypes.has(node.parent?.kind)
	}
}
