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
	): ProgramStructureTree<ProgramStructureTreeType.ArrowFunctionExpression> {
		if (ts.isPropertyDeclaration(node.parent)) {
			return ArrowFunctionHelper.parseWithParentPropertyDeclaration(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}
		if (ts.isParenthesizedExpression(node.parent)) {
			return ArrowFunctionHelper.parseWithParentParenthesizedExpression(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}
		if (ts.isVariableDeclaration(node.parent)) {
			return ArrowFunctionHelper.parseWithParentVariableDeclaration(
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
			ProgramStructureTreeType.ArrowFunctionExpression,
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
	): ProgramStructureTree<ProgramStructureTreeType.ArrowFunctionExpression> {
		switch (parent.name.kind) {
			case ts.SyntaxKind.Identifier:
			case ts.SyntaxKind.PrivateIdentifier: {
				const functionName = `functionExpression:${parent.name.escapedText}`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ArrowFunctionExpression,
					IdentifierType.Name,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.FirstLiteralToken: {
				const functionName =
					`functionExpression:(literal:${traverseNodeInfo.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ArrowFunctionExpression,
					IdentifierType.Literal,
					`{${functionName}}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, node.getStart()),
					TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
				)
			}
			case ts.SyntaxKind.ComputedPropertyName: {
				const functionName =
				`functionExpression:(expression:${traverseNodeInfo.literalFunctionCounter++})`
				return new ProgramStructureTree(
					traverseNodeInfo.tree,
					traverseNodeInfo.idCounter++,
					ProgramStructureTreeType.ArrowFunctionExpression,
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
	): ProgramStructureTree<ProgramStructureTreeType.ArrowFunctionExpression> {
		const functionName =
		`functionExpression:(expression:${traverseNodeInfo.literalFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.tree,
			traverseNodeInfo.idCounter++,
			ProgramStructureTreeType.ArrowFunctionExpression,
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
	): ProgramStructureTree<ProgramStructureTreeType.ArrowFunctionExpression> {
		if (ts.isIdentifier(parent.name)) {
			const functionName = `functionExpression:${parent.name.escapedText}`
			return new ProgramStructureTree(
				traverseNodeInfo.tree,
				traverseNodeInfo.idCounter++,
				ProgramStructureTreeType.ArrowFunctionExpression,
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