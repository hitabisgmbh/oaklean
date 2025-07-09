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

export class ClassExpressionHelper {
	static syntaxKind = ts.SyntaxKind.ClassExpression

	static parseNode(
		node: ts.ClassExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassExpression> {
		const parseNodeFunction = PARSE_NODE_FUNCTIONS[node.parent.kind]
		if (parseNodeFunction !== undefined) {
			return parseNodeFunction(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}

		const className = `classExpression:(anonymous:${traverseNodeInfo.counters.anonymousFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.ClassExpression,
			IdentifierType.Anonymous,
			`{${className}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentParenthesizedExpression(
		node: ts.ClassExpression,
		parent: ts.ParenthesizedExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassExpression> {
		const className = `classExpression:(expression:${traverseNodeInfo.counters.literalFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.ClassExpression,
			IdentifierType.Expression,
			`{${className}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentPropertyDeclaration(
		node: ts.ClassExpression,
		parent: ts.PropertyDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassExpression> {
		switch (parent.name.kind) {
			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.PrivateIdentifier: {
				const className = `classExpression:${parent.name.escapedText}`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ClassExpression,
					IdentifierType.Name,
					`{${className}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.FirstLiteralToken: {
				const className =
					'classExpression:(literal:' +
					`${traverseNodeInfo.counters.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ClassExpression,
					IdentifierType.Literal,
					`{${className}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.ComputedPropertyName: {
				const className =
					'classExpression:(expression:' +
					`${traverseNodeInfo.counters.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ClassExpression,
					IdentifierType.Expression,
					`{${className}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
		}
		LoggerHelper.error(
			'ClassExpressionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
			{
				filePath: traverseNodeInfo.filePath,
				kind: parent.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, parent.name.getStart())
			}
		)
		throw new Error('ClassExpressionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
	}

	static parseWithParentVariableDeclaration(
		node: ts.ClassExpression,
		parent: ts.VariableDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassExpression> {
		if (ts.isIdentifier(parent.name)) {
			const className = `classExpression:${parent.name.escapedText}`
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.ClassExpression,
				IdentifierType.Name,
				`{${className}}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}
		LoggerHelper.error(
			'ClassExpressionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: node.parent.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.parent.getStart())
			}
		)
		throw new Error('ClassExpressionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
	}
}

type ParseNodeFunction = (
	node: any,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeType.ClassExpression>

const PARSE_NODE_FUNCTIONS: Partial<Record<ts.SyntaxKind, ParseNodeFunction>> = {
	[ts.SyntaxKind.PropertyDeclaration]: ClassExpressionHelper.parseWithParentPropertyDeclaration,
	[ts.SyntaxKind.ParenthesizedExpression]: ClassExpressionHelper.parseWithParentParenthesizedExpression,
	[ts.SyntaxKind.VariableDeclaration]: ClassExpressionHelper.parseWithParentVariableDeclaration
}