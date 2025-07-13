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

export class ArrowFunctionHelper {
	static syntaxKind = ts.SyntaxKind.ArrowFunction

	static parseNode(
		node: ts.ArrowFunction,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
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
			`functionExpression:(anonymous:${traverseNodeInfo.counters.anonymousFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.FunctionExpression,
			IdentifierType.Anonymous,
			`{${functionName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentPropertyDeclaration(
		node: ts.ArrowFunction,
		parent: ts.PropertyDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		switch (parent.name.kind) {
			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.PrivateIdentifier: {
				const functionName = `functionExpression:${parent.name.escapedText}`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
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
					`functionExpression:(literal:${traverseNodeInfo.counters.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.FunctionExpression,
					IdentifierType.Literal,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.ComputedPropertyName: {
				const functionName =
				`functionExpression:(expression:${traverseNodeInfo.counters.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.FunctionExpression,
					IdentifierType.Expression,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}	
		}
		LoggerHelper.error(
			'ArrowFunctionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
			{
				filePath: traverseNodeInfo.filePath,
				kind: ts.SyntaxKind[parent.name.kind],
				pos: TypescriptHelper.posToLoc(sourceFile, parent.name.getStart())
			}
		)
		throw new Error('ArrowFunctionHelper (parseWithParentPropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
	}

	static parseWithParentParenthesizedExpression(
		node: ts.ArrowFunction,
		parent: ts.ParenthesizedExpression,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		const functionName =
		`functionExpression:(expression:${traverseNodeInfo.counters.literalFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.FunctionExpression,
			IdentifierType.Expression,
			`{${functionName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithParentVariableDeclaration(
		node: ts.ArrowFunction,
		parent: ts.VariableDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.FunctionExpression> {
		if (ts.isIdentifier(parent.name)) {
			const functionName = `functionExpression:${parent.name.escapedText}`
			return new ProgramStructureTree(
				traverseNodeInfo.resolvedTree(),
				traverseNodeInfo.nextId(),
				ProgramStructureTreeType.FunctionExpression,
				IdentifierType.Name,
				`{${functionName}}` as SourceNodeIdentifierPart_string,
				TypescriptHelper.posToLoc(sourceFile, node.getStart()),
				TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
			)
		}

		LoggerHelper.error(
			'ArrowFunctionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: ts.SyntaxKind[node.parent.kind],
				pos: TypescriptHelper.posToLoc(sourceFile, node.parent.getStart())
			}
		)
		throw new Error('ArrowFunctionHelper (parseWithParentVariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
	}
}

type ParseNodeFunction = (
	node: any,
	parent: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeType.FunctionExpression>

const PARSE_NODE_FUNCTIONS: Partial<Record<ts.SyntaxKind, ParseNodeFunction>> = {
	[ts.SyntaxKind.PropertyDeclaration]: ArrowFunctionHelper.parseWithParentPropertyDeclaration,
	[ts.SyntaxKind.ParenthesizedExpression]: ArrowFunctionHelper.parseWithParentParenthesizedExpression,
	[ts.SyntaxKind.VariableDeclaration]: ArrowFunctionHelper.parseWithParentVariableDeclaration
}