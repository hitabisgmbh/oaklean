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
import { LoggerHelper } from '../LoggerHelper'

export class MethodDeclarationHelper {
	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.MethodDefinition> | undefined {
		if (!ts.isMethodDeclaration(node)) {
			return undefined
		}

		const staticSuffix = TypescriptHelper.hasStaticKeywordModifier(node) ? '@static' : ''
		switch (node.name.kind) {
			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.PrivateIdentifier: {
				const methodName = `method${staticSuffix}:` + node.name.escapedText.toString()
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.MethodDefinition,
					IdentifierType.Name,
					`{${methodName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.FirstLiteralToken: {
				const methodName = `method${staticSuffix}:(literal:${traverseNodeInfo.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.MethodDefinition,
					IdentifierType.Literal,
					`{${methodName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.ComputedPropertyName: {
				const methodName =
					`method${staticSuffix}:(expression:${traverseNodeInfo.expressionFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.MethodDefinition,
					IdentifierType.Expression,
					`{${methodName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			default:
				LoggerHelper.error(
					'MethodDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' + node.name?.kind, {
						filePath: traverseNodeInfo.filePath,
						kind: node.name.kind,
						pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
					}
				)
				throw new Error('MethodDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' + node.name?.kind)
		}
	}

}