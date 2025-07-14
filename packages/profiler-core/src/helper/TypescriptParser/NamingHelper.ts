import * as ts from 'typescript'

import { TraverseNodeInfo } from './TraverseNodeInfo'
import { TypescriptHelper } from './TypescriptHelper'

import { LoggerHelper } from '../LoggerHelper'
// Types
import { IdentifierType } from '../../types'

export class NamingHelper {
	static getName(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
		const getNameFunction = GET_NAME_FUNCTIONS[node.kind]
		if (getNameFunction !== undefined) {
			return getNameFunction(node, sourceFile, traverseNodeInfo)
		}
		return {
			identifier: `(anonymous:${traverseNodeInfo.counters.anonymousFunctionCounter++})`,
			identifierType: IdentifierType.Anonymous
		}
	}

	static getPropertyAssignmentName(
		node: ts.PropertyAssignment,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		const getNameFunction = GET_NAME_FUNCTIONS[node.name.kind]
		if (getNameFunction !== undefined) {
			return getNameFunction(node.name, sourceFile, traverseNodeInfo)
		}
		LoggerHelper.error(
			'NamingHelper (getPropertyAssignmentName): unhandled case: node.name.kind === ' +
				node.name.kind,
			{
				filePath: traverseNodeInfo.filePath,
				kind: node.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
			}
		)
		throw new Error(
			'NamingHelper (getPropertyAssignmentName): unhandled case: node.name.kind === ' +
				node.name.kind
		)
	}

	static getPropertyDeclarationName(
		node: ts.PropertyDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		const getNameFunction = GET_NAME_FUNCTIONS[node.name.kind]
		if (getNameFunction !== undefined) {
			return getNameFunction(node.name, sourceFile, traverseNodeInfo)
		}
		LoggerHelper.error(
			'NamingHelper (getPropertyDeclarationName): unhandled case: node.name.kind === ' +
				node.name.kind,
			{
				filePath: traverseNodeInfo.filePath,
				kind: node.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
			}
		)
		throw new Error(
			'NamingHelper (getPropertyDeclarationName): unhandled case: node.name.kind === ' +
				node.name.kind
		)
	}



	static getVariableName(
		node: ts.VariableDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		const getNameFunction = GET_NAME_FUNCTIONS[node.name.kind]
		if (getNameFunction !== undefined) {
			return getNameFunction(node.name, sourceFile, traverseNodeInfo)
		}
		LoggerHelper.error(
			'NamingHelper (getVariableName): unhandled case: node.name.kind  === ' + node.name.kind, {
				filePath: traverseNodeInfo.filePath,
				kind: node.name.kind,
				pos: TypescriptHelper.posToLoc(sourceFile, node.name.getStart())
			}
		)
		throw new Error('NamingHelper (getVariableName): unhandled case: node.name.kind  === ' + node.name.kind)
	}

	static getIdentifierName(
		node: ts.Identifier,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		return {
			identifier: node.escapedText.toString(),
			identifierType: IdentifierType.Name
		}
	}

	static getLiteralName(
		node: ts.Identifier,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		return {
			identifier: `(literal:${traverseNodeInfo.counters
				.literalFunctionCounter++})`,
			identifierType: IdentifierType.Literal
		}
	}

	static getComputedPropertyName(
		node: ts.ComputedPropertyName,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): { identifier: string; identifierType: IdentifierType } {
		return {
			identifier: `(expression:${traverseNodeInfo.counters.literalFunctionCounter++})`,
			identifierType: IdentifierType.Expression
		}
	}
}

type GetNameFunction = (
	node: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => { identifier: string; identifierType: IdentifierType }

const GET_NAME_FUNCTIONS: Partial<Record<ts.SyntaxKind, GetNameFunction>> = {
	[ts.SyntaxKind.PropertyDeclaration]: NamingHelper.getPropertyDeclarationName,
	[ts.SyntaxKind.VariableDeclaration]: NamingHelper.getVariableName,
	[ts.SyntaxKind.PropertyAssignment]: NamingHelper.getPropertyAssignmentName,

	[ts.SyntaxKind.Identifier]: NamingHelper.getIdentifierName,
	[ts.SyntaxKind.PrivateIdentifier]: NamingHelper.getIdentifierName,
	[ts.SyntaxKind.StringLiteral]: NamingHelper.getLiteralName,
	[ts.SyntaxKind.NumericLiteral]: NamingHelper.getLiteralName,
	[ts.SyntaxKind.ComputedPropertyName]: NamingHelper.getComputedPropertyName
}