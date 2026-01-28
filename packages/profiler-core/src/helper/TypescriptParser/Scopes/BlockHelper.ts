import * as ts from 'typescript'

import { TypescriptHelper } from '../TypescriptHelper'
import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../../types'

export class BlockHelper {
	static syntaxKind = ts.SyntaxKind.Block

	static parseNode(
		node: ts.Block,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
		resolve(): ProgramStructureTree<ProgramStructureTreeType.Block>
	} | null {
		if (
			node.parent.kind === ts.SyntaxKind.SourceFile ||
			node.parent.kind === ts.SyntaxKind.ModuleBlock ||
			node.parent.kind === ts.SyntaxKind.Block
		) {
			return {
				resolve() {
					const statementName = `(block:${traverseNodeInfo.counters.blockCounter++})`
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.Block,
						IdentifierType.Statement,
						`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
		return null
	}
}
