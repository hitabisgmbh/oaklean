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

export class IfStatementHelper {
	static syntaxKind = ts.SyntaxKind.IfStatement

	static parseNode(
		node: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve: () => ProgramStructureTree<ProgramStructureTreeType.IfStatement> } {
		return {
			resolve: () => {
				const statementName = `(if:${traverseNodeInfo.counters.ifStatementCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.IfStatement,
					IdentifierType.Statement,
					`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}

	static ifCase(
		node: ts.Node,
		parent: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve: () => ProgramStructureTree<
		ProgramStructureTreeType.IfThenStatement | ProgramStructureTreeType.IfElseStatement
		> } | undefined
		| undefined {
		if (parent.thenStatement === node) {
			return {
				resolve: () => {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.IfThenStatement,
						IdentifierType.Statement,
						'{scope:then}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
		if (parent.elseStatement === node) {
			return {
				resolve: () => {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.IfElseStatement,
						IdentifierType.Statement,
						'{scope:else}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
	}
}
