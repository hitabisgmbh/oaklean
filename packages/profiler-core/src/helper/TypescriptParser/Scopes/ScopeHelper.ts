import * as ts from 'typescript'

import { IfStatementHelper } from './IfStatementHelper'
import { SwitchStatementHelper } from './SwitchStatementHelper'

import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType
} from '../../../types'

type ClearEmptyScopesFunction = (traverseNodeInfo: TraverseNodeInfo) => void

const CLEAR_EMPTY_SCOPES: Partial<Record<IdentifierType, ClearEmptyScopesFunction>> = {
	[IdentifierType.IfStatement]: IfStatementHelper.clearEmptyScopes,
	[IdentifierType.SwitchStatement]: SwitchStatementHelper.clearEmptyScopes,
}

type ParseIntermediateFunction = (
	node: ts.Node,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeType.Scope> | undefined

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
			traverseNodeInfo.tree.type === ProgramStructureTreeType.Scope &&
			traverseNodeInfo.tree.children.size === 0
		) {
			const clearEmptyScopeFunction = CLEAR_EMPTY_SCOPES[traverseNodeInfo.tree.identifierType]
			if (clearEmptyScopeFunction !== undefined) {
				clearEmptyScopeFunction(traverseNodeInfo)
			}

			// remove empty scopes since scopes are only used as a hierarchy level to distinguish between
			// functions, methods, etc.
			traverseNodeInfo.tree.parent?.children.delete(traverseNodeInfo.tree.identifier)
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
