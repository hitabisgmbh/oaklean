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

export class IfStatementHelper {
	static syntaxKind = ts.SyntaxKind.IfStatement

	static parseNode(
		node: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> {
		const statementName =`(if:${traverseNodeInfo.ifStatementCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.Scope,
			IdentifierType.IfStatement,
			`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static ifCase(
		node: ts.Node,
		parent: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> | undefined {
		if (parent.thenStatement === node) {
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.Scope,
				IdentifierType.ThenStatement,
				'{scope:then}' as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd())
			)
		}
		if (parent.elseStatement === node) {
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.Scope,
				IdentifierType.ElseStatement,
				'{scope:else}' as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd())
			)
		}
	}

	static clearEmptyScopes(
		traverseNodeInfo: TraverseNodeInfo
	) {
		if (traverseNodeInfo.parent) {
			traverseNodeInfo.parent.ifStatementCounter--
		}
	}
}