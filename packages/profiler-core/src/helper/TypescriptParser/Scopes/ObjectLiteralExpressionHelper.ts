import * as ts from 'typescript'

import { NamingHelper } from '../NamingHelper'
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
	): { resolve(): ProgramStructureTree<ProgramStructureTreeType.ObjectLiteralExpression> } {
		return {
			resolve() {
				const { identifier, identifierType } = NamingHelper.getName(
					node.parent,
					sourceFile,
					traverseNodeInfo
				)

				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.ObjectLiteralExpression,
					identifierType,
					`{scope:${identifier}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}