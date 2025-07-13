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

export class ObjectLiteralExpressionHelper {
	static syntaxKind = ts.SyntaxKind.ObjectLiteralExpression

	static parseNode(
		node: ts.ObjectLiteralExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ObjectLiteralExpression> {
		const scopeName = `scope:(anonymous:${traverseNodeInfo.counters.anonymousScopeCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.ObjectLiteralExpression,
			IdentifierType.Anonymous,
			`{${scopeName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd())
		)
	}

	static clearEmptyScopes(traverseNodeInfo: TraverseNodeInfo) {
		if (traverseNodeInfo.parent) {
			traverseNodeInfo.parent.counters.anonymousScopeCounter--
		}
	}
}