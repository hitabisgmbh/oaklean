import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'
import { NamingHelper } from './NamingHelper'

import { LoggerHelper } from '../LoggerHelper'
import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class GetAccessorDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.GetAccessor

	static parseNode(
		node: ts.GetAccessorDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
			resolve(): ProgramStructureTree<ProgramStructureTreeType.GetAccessorDeclaration>
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

				const { identifier, identifierType } = NamingHelper.getName(
					node.name,
					sourceFile,
					traverseNodeInfo
				)

				if (identifierType === IdentifierType.Anonymous) {
					LoggerHelper.error(
						'GetAccessorDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' +
							node.name.kind,
						{
							filePath: traverseNodeInfo.filePath,
							kind: node.name.kind,
							pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
						}
					)
					throw new Error(
						'GetAccessorDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' +
							node.name.kind
					)
				}

				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.GetAccessorDeclaration,
					identifierType,
					`{get${staticSuffix}:${identifier}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}
