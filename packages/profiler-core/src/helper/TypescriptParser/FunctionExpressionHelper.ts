import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'
import { NamingHelper } from './NamingHelper'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class FunctionExpressionHelper {
	static syntaxKind = ts.SyntaxKind.FunctionExpression

	static parseNode(
		node: ts.FunctionExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		const emitHelperName = TypescriptHelper.getEmitHelperName(node)
		if (emitHelperName !== undefined) {
			const functionName = `functionExpression:${emitHelperName}`
			return new ProgramStructureTree(
				traverseNodeInfo.resolvedTree(),
				traverseNodeInfo.nextId(),
				ProgramStructureTreeType.FunctionExpression,
				IdentifierType.Name,
				`{${functionName}}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		const { suffix, identifier, identifierType } = NamingHelper.getName(
			node.parent,
			sourceFile,
			traverseNodeInfo
		)

		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.FunctionExpression,
			identifierType,
			`{functionExpression${suffix}:${identifier}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}
}