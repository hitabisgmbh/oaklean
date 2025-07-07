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

export class FunctionDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.FunctionDeclaration

	static parseNode(
		node: ts.FunctionDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionDeclaration> {
		if (node.name !== undefined && ts.isIdentifier(node.name)) {
			const functionName = node.name.escapedText
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.FunctionDeclaration,
				IdentifierType.Name,
				('{function:' + functionName + '}') as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		
		if (TypescriptHelper.hasDefaultKeywordModifier(node)) {
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.FunctionDeclaration,
				IdentifierType.KeyWord,
				'{function:default}' as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		LoggerHelper.error(
			'FunctionDeclarationHelper (parseNode): unhandled case, function has no name and is now default export', {
				filePath: traverseNodeInfo.filePath,
				pos: TypescriptHelper.posToLoc(sourceFile, node.getStart() || 0)
			}
		)
		throw new Error('FunctionDeclarationHelper (parseNode): unhandled case, function has no name and is now default export')
	}
}