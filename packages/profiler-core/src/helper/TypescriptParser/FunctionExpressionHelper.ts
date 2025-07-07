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

export class FunctionExpressionHelper {
	static syntaxKind = ts.SyntaxKind.FunctionExpression

	static parseNode(
		node: ts.FunctionExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		const emitHelperName = TypescriptHelper.getEmitHelperName(node)
		if (emitHelperName !== undefined) {
			const functionName = `functionExpression:${emitHelperName}`
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.FunctionExpression,
				IdentifierType.Name,
				`{${functionName}}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		
		const parseNodeFunction = PARSE_NODE_FUNCTIONS[node.parent.kind]
		if (parseNodeFunction !== undefined) {
			return parseNodeFunction(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}

		const functionName =
			`functionExpression:(anonymous:${traverseNodeInfo.anonymousFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.FunctionExpression,
			IdentifierType.Anonymous,
			`{${functionName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentPropertyDeclaration(
		node: ts.FunctionExpression,
		parent: ts.PropertyDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		switch (parent.name.kind) {
			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.PrivateIdentifier: {
				const functionName = `functionExpression:${parent.name.escapedText}`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.FunctionExpression,
					IdentifierType.Name,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.FirstLiteralToken: {
				const functionName =
					'functionExpression:(literal:' +
					`${traverseNodeInfo.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.FunctionExpression,
					IdentifierType.Literal,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.ComputedPropertyName: {
				const functionName =
					'functionExpression:(expression:' +
					`${traverseNodeInfo.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.FunctionExpression,
					IdentifierType.Expression,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}	
		}
		LoggerHelper.error(
			'FunctionExpressionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
			{
				filePath: traverseNodeInfo.filePath,
				kind: parent.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, parent.name.getStart())
			}
		)
		throw new Error('FunctionExpressionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
	}

	static parseWithParentParenthesizedExpression(
		node: ts.FunctionExpression,
		parent: ts.ParenthesizedExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		const functionName = `functionExpression:(expression:${traverseNodeInfo.literalFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.FunctionExpression,
			IdentifierType.Expression,
			`{${functionName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentVariableDeclaration(
		node: ts.FunctionExpression,
		parent: ts.VariableDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		if (ts.isIdentifier(parent.name)) {
			const functionName = `functionExpression:${parent.name.escapedText}`
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.FunctionExpression,
				IdentifierType.Name,
				`{${functionName}}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		LoggerHelper.error(
			'FunctionExpressionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: node.parent.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.parent.getStart())
			}
		)
		throw new Error('FunctionExpressionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
	}
}

type ParseNodeFunction = (
	node: any,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeType.FunctionExpression>

const PARSE_NODE_FUNCTIONS: Partial<Record<ts.SyntaxKind, ParseNodeFunction>> = {
	[ts.SyntaxKind.PropertyDeclaration]: FunctionExpressionHelper.parseWithParentPropertyDeclaration,
	[ts.SyntaxKind.ParenthesizedExpression]: FunctionExpressionHelper.parseWithParentParenthesizedExpression,
	[ts.SyntaxKind.VariableDeclaration]: FunctionExpressionHelper.parseWithParentVariableDeclaration
}