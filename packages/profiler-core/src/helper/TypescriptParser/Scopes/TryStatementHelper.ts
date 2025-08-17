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

export class TryStatementHelper {
	static syntaxKind = ts.SyntaxKind.TryStatement

	static parseNode(
		node: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeType.TryStatement> } {
		return {
			resolve() {
				const statementName = `(try:${traverseNodeInfo.counters.tryStatementCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.TryStatement,
					IdentifierType.Statement,
					`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}

	static tryCatchFinally(
		node: ts.Node,
		parent: ts.TryStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<
		ProgramStructureTreeType.TryBlock | ProgramStructureTreeType.CatchClause | ProgramStructureTreeType.FinallyBlock
		> } | undefined
		| undefined {
		if (parent.tryBlock === node) {
			return {
				resolve() {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.TryBlock,
						IdentifierType.Statement,
						'{scope:(try)}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
		if (parent.catchClause === node) {
			return {
				resolve() {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.CatchClause,
						IdentifierType.Statement,
						'{scope:(catch)}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
		if (parent.finallyBlock === node) {
			return {
				resolve() {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.FinallyBlock,
						IdentifierType.Statement,
						'{scope:(finally)}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
	}
}
