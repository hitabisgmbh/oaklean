import * as ts from 'typescript'

// Types
import {
	SourceNodeIdentifier_string,
	NodeLocation
} from '../../types'

export enum EmitHelperNames {
	// TypeScript Helpers
	decorate = '__decorate',
	metadata = '__metadata',
	param = '__param',
	// ES Decorators Helpers
	esDecorate = '__esDecorate',
	runInitializers = '__runInitializers',
	// ES2018 Helpers
	assign = '__assign',
	await = '__await',
	asyncGenerator = '__asyncGenerator',
	asyncDelegator = '__asyncDelegator',
	asyncValues = '__asyncValues',
	// ES2018 Destructuring Helpers
	rest = '__rest',
	// ES2017 Helpers
	awaiter = '__awaiter',
	// ES2015 Helpers
	extends = '__extends',
	makeTemplateObject = '__makeTemplateObject',
	read = '__read',
	spreadArray = '__spreadArray',
	propKey = '__propKey',
	setFunctionName = '__setFunctionName',
	// ES2015 Destructuring Helpers
	values = '__values'
}

export const EmitHelperNameStrings = Object.values(EmitHelperNames)

export class TypescriptHelper {
	static posToLoc(sourceFile: ts.SourceFile, pos: number): NodeLocation {
		const lineAndChar = sourceFile.getLineAndCharacterOfPosition(pos)

		return {
			line: lineAndChar.line + 1,
			column: lineAndChar.character
		}
	}

	static isUseStrict(node: ts.Node) {
		if (ts.isStringLiteral(node)) {
			if (node.text === 'use strict') {
				return true
			}
		}
		return false
	}

	static getEmitHelperName(node: ts.FunctionExpression): EmitHelperNames | undefined {
		const varDeclaration = node?.parent?.parent

		if (varDeclaration !== undefined && ts.isVariableDeclaration(varDeclaration)) {
			if (ts.isIdentifier(varDeclaration.name)) {
				if (EmitHelperNameStrings.includes(varDeclaration.name.text as EmitHelperNames)) {
					return varDeclaration.name.text as EmitHelperNames
				}
			}
		}

		const varDeclarationExtends = node?.parent?.parent?.parent?.parent
		if (varDeclarationExtends !== undefined && ts.isVariableDeclaration(varDeclarationExtends)) {
			if (ts.isIdentifier(varDeclarationExtends.name)) {
				if (varDeclarationExtends.name.text === EmitHelperNames.extends) {
					return EmitHelperNames.extends
				}
			}
		}
		return undefined
	}

	static awaiterSourceNodeIdentifier(): SourceNodeIdentifier_string {
		return '{root}.{functionExpression:__awaiter}' as SourceNodeIdentifier_string
	}

	static hasDefaultKeywordModifier(node: ts.ClassDeclaration | ts.ClassExpression | ts.FunctionDeclaration): boolean {
		if (node.modifiers === undefined || node.modifiers.length === 0) {
			return false
		}
		for (const modifier of node.modifiers) {
			if (modifier.kind === ts.SyntaxKind.DefaultKeyword) {
				return true
			}
		}
		return false
	}

	static hasStaticKeywordModifier(node: ts.MethodDeclaration | ts.PropertyDeclaration): boolean {
		if (node.modifiers === undefined || node.modifiers.length === 0) {
			return false
		}
		for (const modifier of node.modifiers) {
			if (modifier.kind === ts.SyntaxKind.StaticKeyword) {
				return true
			}
		}
		return false
	}
}