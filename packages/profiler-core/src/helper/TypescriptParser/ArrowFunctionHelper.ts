import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'
import { NamingHelper } from './NamingHelper'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class ArrowFunctionHelper {
	static syntaxKind = ts.SyntaxKind.ArrowFunction

	static parseNode(
		node: ts.ArrowFunction,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		const staticSuffix = TypescriptHelper.hasStaticKeywordModifier(node) ? '@static' : ''
		const { identifier, identifierType } = NamingHelper.getName(
			node.parent,
			sourceFile,
			traverseNodeInfo
		)

		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.FunctionExpression,
			identifierType,
			`{functionExpression${staticSuffix}:${identifier}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}
}