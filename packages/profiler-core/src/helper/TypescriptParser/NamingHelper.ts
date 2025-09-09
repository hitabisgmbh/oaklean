import * as ts from 'typescript'

import { ExpressionHelper } from './ExpressionHelper'
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
		return NamingHelper.getAnonymousName(node, sourceFile, traverseNodeInfo)
	}

	static getAnonymousName(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	) {
		return {
			suffix: '',
			identifier: `(anonymous:${traverseNodeInfo.counters.anonymousFunctionCounter++})`,
			identifierType: IdentifierType.Anonymous
		}
	}

	static getPropertyAssignmentName(
		node: ts.PropertyAssignment,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ReturnType<GetNameFunction> {
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
	): ReturnType<GetNameFunction> {
		const staticSuffix = TypescriptHelper.hasStaticKeywordModifier(node) ? '@static' : ''
		const getNameFunction = GET_NAME_FUNCTIONS[node.name.kind]
		if (getNameFunction !== undefined) {
			const result = getNameFunction(node.name, sourceFile, traverseNodeInfo)
			return {
				...result,
				suffix: staticSuffix
			}
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
	): ReturnType<GetNameFunction> {
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		sourceFile: ts.SourceFile,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		traverseNodeInfo: TraverseNodeInfo
	): ReturnType<GetNameFunction> {
		return {
			suffix: '',
			identifier: node.escapedText.toString(),
			identifierType: IdentifierType.Name
		}
	}

	static getLiteralName(
		node: ts.StringLiteral | ts.NumericLiteral | ts.BigIntLiteral,
		sourceFile: ts.SourceFile,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		traverseNodeInfo: TraverseNodeInfo
	): ReturnType<GetNameFunction> {
		const expressionHash = ExpressionHelper.hashExpression(
			node,
			sourceFile
		)

		return {
			suffix: '',
			identifier: `(literal:${expressionHash})`,
			identifierType: IdentifierType.Literal
		}
	}

	static getComputedPropertyName(
		node: ts.ComputedPropertyName,
		sourceFile: ts.SourceFile,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		traverseNodeInfo: TraverseNodeInfo
	): ReturnType<GetNameFunction> {
		const expressionHash = ExpressionHelper.hashExpression(
			node.expression,
			sourceFile
		)
		return {
			suffix: '',
			identifier: `(expression:${expressionHash})`,
			identifierType: IdentifierType.Expression
		}
	}
}

type GetNameFunction = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	node: any,
	sourceFile: ts.SourceFile,
	traverseNodeInfo: TraverseNodeInfo
) => {
	suffix: string;
	identifier: string;
	identifierType: IdentifierType
}

const GET_NAME_FUNCTIONS: Partial<Record<ts.SyntaxKind, GetNameFunction>> = {
	[ts.SyntaxKind.PropertyDeclaration]: NamingHelper.getPropertyDeclarationName,
	[ts.SyntaxKind.VariableDeclaration]: NamingHelper.getVariableName,
	[ts.SyntaxKind.PropertyAssignment]: NamingHelper.getPropertyAssignmentName,

	[ts.SyntaxKind.Identifier]: NamingHelper.getIdentifierName,
	[ts.SyntaxKind.PrivateIdentifier]: NamingHelper.getIdentifierName,
	[ts.SyntaxKind.BigIntLiteral]: NamingHelper.getLiteralName,
	[ts.SyntaxKind.StringLiteral]: NamingHelper.getLiteralName,
	[ts.SyntaxKind.NumericLiteral]: NamingHelper.getLiteralName,
	[ts.SyntaxKind.ComputedPropertyName]: NamingHelper.getComputedPropertyName,
	[ts.SyntaxKind.ObjectBindingPattern]: NamingHelper.getAnonymousName,
	[ts.SyntaxKind.ArrayBindingPattern]: NamingHelper.getAnonymousName
}