import * as ts from 'typescript'

import { ObjectLiteralExpressionHelper } from './ObjectLiteralExpressionHelper'
import { IfStatementHelper } from './IfStatementHelper'

import { TraverseNodeInfo } from '../TraverseNodeInfo'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType
} from '../../../types'

export class ScopeHelper {
	static clearEmptyScopes(
		traverseNodeInfo: TraverseNodeInfo
	) {
		if (
			traverseNodeInfo.tree.type === ProgramStructureTreeType.Scope &&
			traverseNodeInfo.tree.children.size === 0
		) {
			if (traverseNodeInfo.tree.identifierType === IdentifierType.IfStatement) {
				IfStatementHelper.clearEmptyScopes(traverseNodeInfo)
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
		if (node.parent?.kind === ts.SyntaxKind.IfStatement) {
			return IfStatementHelper.ifCase(
				node,
				node.parent as ts.IfStatement,
				sourceFile,
				traverseNodeInfo
			)
		}
	}
}
