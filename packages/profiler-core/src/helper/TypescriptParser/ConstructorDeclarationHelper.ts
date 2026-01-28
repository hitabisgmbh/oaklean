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

export class ConstructorDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.Constructor

	static parseNode(
		node: ts.ConstructorDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
		resolve(): ProgramStructureTree<
			| ProgramStructureTreeType.ConstructorDeclaration
			| ProgramStructureTreeType.MethodDefinition
		>
		resolveWithNoChildren: true
	} | null {
		if (node.body === undefined) {
			return null
		}
		return {
			resolveWithNoChildren: true,
			resolve() {
				const staticSuffix = TypescriptHelper.hasStaticKeywordModifier(node)
					? '@static'
					: ''

				if (staticSuffix !== '') {
					// static constructors are just methods
					return new ProgramStructureTree(
						traverseNodeInfo.resolvedTree(),
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.MethodDefinition,
						IdentifierType.Name,
						`{method${staticSuffix}:constructor}` as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}

				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.ConstructorDeclaration,
					IdentifierType.Name,
					'{constructor:constructor}' as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}
