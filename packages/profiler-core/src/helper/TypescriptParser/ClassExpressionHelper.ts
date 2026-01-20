import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'
import { NamingHelper } from './NamingHelper'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import { ProgramStructureTreeType, SourceNodeIdentifierPart_string } from '../../types'

export class ClassExpressionHelper {
	static syntaxKind = ts.SyntaxKind.ClassExpression

	static parseNode(
		node: ts.ClassExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
		resolve(): ProgramStructureTree<ProgramStructureTreeType.ClassExpression>
		resolveWithNoChildren: true
	} {
		return {
			resolveWithNoChildren: true,
			resolve() {
				const { suffix, identifier, identifierType } = NamingHelper.getName(node.parent, sourceFile, traverseNodeInfo)

				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.ClassExpression,
					identifierType,
					`{classExpression${suffix}:${identifier}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}
