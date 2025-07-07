import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'

import { LoggerHelper } from '../LoggerHelper'
import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class ClassDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.ClassDeclaration

	static parseNode(
		node: ts.ClassDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassDeclaration> {
		if (node.name?.kind === ts.SyntaxKind.Identifier) {
			const className = node.name.escapedText
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.ClassDeclaration,
				IdentifierType.Name,
				('{class:' + className + '}') as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		if (TypescriptHelper.hasDefaultKeywordModifier(node)) {
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.ClassDeclaration,
				IdentifierType.KeyWord,
				('{class:default}') as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		LoggerHelper.error(
			'ClassDeclarationHelper (parseNode): unhandled case: node.name.kind === ' + node.name?.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: node.name?.kind ? ts.SyntaxKind[node.name?.kind] : undefined,
				pos: node.name ? TypescriptHelper.posToLoc(sourceFile, node.name.getStart()) : undefined
			}
		)
		throw new Error('ClassDeclarationHelper (parseNode): unhandled case: node.name.kind === ' + node.name?.kind)
	}
}