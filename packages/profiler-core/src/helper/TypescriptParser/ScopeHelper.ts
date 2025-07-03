import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class ScopeHelper {
	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> | undefined {
		if (ts.isObjectLiteralExpression(node)) {
			return ScopeHelper.parseObjectLiteralExpression(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}
	}

	static parseObjectLiteralExpression(
		node: ts.ObjectLiteralExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.Scope> {
		const scopeName =
		`scope:(anonymous:${traverseNodeInfo.anonymousScopeCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.Scope,
			IdentifierType.Anonymous,
			`{${scopeName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}
}