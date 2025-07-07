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
	): ProgramStructureTree<ProgramStructureTreeType.ConstructorDeclaration> {
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.ConstructorDeclaration,
			IdentifierType.Name,
			'{constructor:constructor}' as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}
}