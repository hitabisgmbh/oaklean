import * as ts from 'typescript'

import { TypescriptHelper } from '../TypescriptHelper'
import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import { IdentifierType, ProgramStructureTreeType, SourceNodeIdentifierPart_string } from '../../../types'

export class WhileStatementHelper {
	static syntaxKind = [ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement]

	static parseNode(
		node: ts.WhileStatement | ts.DoStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeType.WhileStatement> } {
		return {
			resolve() {
				const statementName = `(while:${traverseNodeInfo.counters.whileStatementCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.WhileStatement,
					IdentifierType.Statement,
					`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}
}
