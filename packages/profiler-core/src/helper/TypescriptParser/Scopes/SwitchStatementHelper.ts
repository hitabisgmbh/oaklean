import * as ts from 'typescript'

import { TypescriptHelper } from '../TypescriptHelper'
import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../../types'
import { ExpressionHelper } from '../ExpressionHelper'

export class SwitchStatementHelper {
	static syntaxKind = ts.SyntaxKind.SwitchStatement

	static parseNode(
		node: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> {
		const statementName =`(switch:${traverseNodeInfo.switchCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.Scope,
			IdentifierType.SwitchStatement,
			`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static switchCase(
		node: ts.Node,
		parent: ts.CaseBlock,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> | undefined {
		if (node.kind === ts.SyntaxKind.DefaultClause) {
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.Scope,
				IdentifierType.SwitchCase,
				'{scope:(case:default)}' as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd())
			)
		}

		if (node.kind === ts.SyntaxKind.CaseClause) {
			const expressionHash = ExpressionHelper.hashExpression(
				(node as ts.CaseClause).expression,
				sourceFile
			)
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.Scope,
				IdentifierType.SwitchCase,
				`{scope:(case:${expressionHash})}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd())
			)
		}
	}

	static clearEmptyScopes(
		traverseNodeInfo: TraverseNodeInfo
	) {
		if (traverseNodeInfo.parent) {
			traverseNodeInfo.parent.switchCounter--
		}
	}
}