import * as ts from 'typescript'

import { TypescriptHelper } from '../TypescriptHelper'
import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import { IdentifierType, ProgramStructureTreeType, SourceNodeIdentifierPart_string } from '../../../types'
import { ExpressionHelper } from '../ExpressionHelper'

export class SwitchStatementHelper {
	static syntaxKind = ts.SyntaxKind.SwitchStatement

	static parseNode(
		node: ts.IfStatement,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeType.SwitchStatement> } {
		return {
			resolve() {
				const statementName = `(switch:${traverseNodeInfo.counters.switchCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.SwitchStatement,
					IdentifierType.Statement,
					`{scope:${statementName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd())
				)
			}
		}
	}

	static switchCase(
		node: ts.Node,
		parent: ts.CaseBlock,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { resolve(): ProgramStructureTree<ProgramStructureTreeType.SwitchCaseClause> } | undefined {
		if (node.kind === ts.SyntaxKind.DefaultClause) {
			return {
				resolve() {
					const tree = traverseNodeInfo.resolvedTree()
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.SwitchCaseClause,
						IdentifierType.KeyWord,
						'{scope:(case:default)}' as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}

		if (node.kind === ts.SyntaxKind.CaseClause) {
			return {
				resolve() {
					const tree = traverseNodeInfo.resolvedTree()
					const expressionHash = ExpressionHelper.hashExpression((node as ts.CaseClause).expression, sourceFile)
					return new ProgramStructureTree(
						tree,
						traverseNodeInfo.nextId(),
						ProgramStructureTreeType.SwitchCaseClause,
						IdentifierType.Hash,
						`{scope:(case:${expressionHash})}` as SourceNodeIdentifierPart_string,
						TypescriptHelper.posToLoc(sourceFile, node.getStart()),
						TypescriptHelper.posToLoc(sourceFile, node.getEnd())
					)
				}
			}
		}
	}
}
