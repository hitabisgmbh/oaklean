import * as ts from 'typescript'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'
import { LoggerHelper } from '../LoggerHelper'

export class ClassExpressionHelper {
	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.ClassExpression> | undefined {
		if (!ts.isClassExpression(node)) {
			return undefined
		}

		if (ts.isParenthesizedExpression(node.parent)) {
			return ClassExpressionHelper.parseWithParentParenthesizedExpression(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isPropertyDeclaration(node.parent)) {
			return ClassExpressionHelper.parseWithParentPropertyDeclaration(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isVariableDeclaration(node.parent)) {
			return ClassExpressionHelper.parseWithParentVariableDeclaration(
				node,
				node.parent,
				sourceFile,
				traverseNodeInfo
			)
		}

		const className = `classExpression:(anonymous:${traverseNodeInfo.anonymousFunctionCounter++})`
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
		const className = `classExpression:(expression:${traverseNodeInfo.literalFunctionCounter++})`
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
					`${traverseNodeInfo.literalFunctionCounter++})`
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
					`${traverseNodeInfo.literalFunctionCounter++})`
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