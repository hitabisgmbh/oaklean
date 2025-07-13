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

export class MethodDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.MethodDeclaration

	static parseNode(
		node: ts.MethodDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree<ProgramStructureTreeType.MethodDefinition> {
		const staticSuffix = TypescriptHelper.hasStaticKeywordModifier(node) ? '@static' : ''
		
		const parseNodeFunction = PARSE_NODE_FUNCTIONS[node.name.kind]
		if (parseNodeFunction !== undefined) {
			return parseNodeFunction(
				staticSuffix,
				node,
				node.name,
				sourceFile,
				traverseNodeInfo
			)
		}
		
		LoggerHelper.error(
			'MethodDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' + node.name.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: node.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
			}
		)
		throw new Error('MethodDeclarationHelper (parseNode): unhandled case: node.name.kind  === ' + node.name.kind)
	}


	static parseWithNameIdentifier(
		staticSuffix: string,
		node: ts.MethodDeclaration,
		identifier: ts.Identifier | ts.PrivateIdentifier,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
		const methodName = `method${staticSuffix}:` + identifier.escapedText.toString()
		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.MethodDefinition,
			IdentifierType.Name,
			`{${methodName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithNameLiteral(
		staticSuffix: string,
		node: ts.MethodDeclaration,
		identifier: ts.StringLiteral | ts.NumericLiteral,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
		const methodName = `method${staticSuffix}:(literal:${traverseNodeInfo.counters.literalFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.MethodDefinition,
			IdentifierType.Literal,
			`{${methodName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}

	static parseWithNameComputedPropertyName(
		staticSuffix: string,
		node: ts.MethodDeclaration,
		identifier: ts.ComputedPropertyName,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
		const methodName =
			`method${staticSuffix}:(expression:${traverseNodeInfo.counters.expressionFunctionCounter++})`
		return new ProgramStructureTree(
			traverseNodeInfo.resolvedTree(),
			traverseNodeInfo.nextId(),
			ProgramStructureTreeType.MethodDefinition,
			IdentifierType.Expression,
			`{${methodName}}` as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, node.getStart()),
			TypescriptHelper.posToLoc(sourceFile, node.getEnd()),
		)
	}
}

type ParseNodeFunction = (
	staticSuffix: string,
	node: ts.MethodDeclaration,
	identifier: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => ProgramStructureTree<ProgramStructureTreeType.MethodDefinition>

const PARSE_NODE_FUNCTIONS: Partial<Record<ts.SyntaxKind, ParseNodeFunction>> = {
	[ts.SyntaxKind.Identifier]: MethodDeclarationHelper.parseWithNameIdentifier,
	[ts.SyntaxKind.PrivateIdentifier]: MethodDeclarationHelper.parseWithNameIdentifier,
	[ts.SyntaxKind.StringLiteral]: MethodDeclarationHelper.parseWithNameLiteral,
	[ts.SyntaxKind.NumericLiteral]: MethodDeclarationHelper.parseWithNameLiteral,
	[ts.SyntaxKind.ComputedPropertyName]: MethodDeclarationHelper.parseWithNameComputedPropertyName
}