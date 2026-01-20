import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import { IdentifierType, ProgramStructureTreeType, SourceNodeIdentifierPart_string } from '../../types'

export class ClassStaticBlockDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.ClassStaticBlockDeclaration

	static parseNode(
		node: ts.ClassStaticBlockDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
		resolve(): ProgramStructureTree<ProgramStructureTreeType.ClassStaticBlockDeclaration>
		resolveWithNoChildren: true
	} | null {
		return {
			resolveWithNoChildren: true,
			resolve() {
				const tree = traverseNodeInfo.resolvedTree()
				return new ProgramStructureTree(
					tree,
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.ClassStaticBlockDeclaration,
					IdentifierType.Statement,
					`{static:${traverseNodeInfo.counters.staticBlockCounter++}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}
