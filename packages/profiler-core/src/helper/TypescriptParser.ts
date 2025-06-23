import * as fs from 'fs'
import * as path from 'path'

import * as ts from 'typescript'

import { TypeScriptHelper } from './TypescriptHelper'
import { LoggerHelper } from './LoggerHelper'

import { ProgramStructureTree } from '../model/ProgramStructureTree'
import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	ProgramStructureTreeType,
	NodeLocation,
	IdentifierType,
	UnifiedPath_string,
	SourceNodeIdentifierPart_string
} from '../types'

type TraverseNodeInfo = {
	tree: ProgramStructureTree,
	anonymousFunctionCounter: number
	expressionFunctionCounter: number
	literalFunctionCounter: number
}

type OnDuplicateIdentifierCallback = (
	filePath: UnifiedPath | UnifiedPath_string,
	node:
	ts.FunctionDeclaration |
	ts.FunctionExpression |
	ts.ArrowFunction | ts.MethodDeclaration | ts.ClassDeclaration | ts.ConstructorDeclaration,
	identifier: string,
	loc: {
		begin: NodeLocation,
		end: NodeLocation
	},
	duplicateLoc: {
		begin: NodeLocation,
		end: NodeLocation
	}
) => void

export class TypescriptParser {

	/**
	 * Method to traverse through a typescript source file
	 * 
	 * @param sourceFile typescript source file object
	 * @param callback Argument with an enter and a leave method that are called when a source node is visited.
	 */
	static traverseSourceFile(
		sourceFile: ts.SourceFile,
		callback: {
			enter: (node: ts.Node) => void,
			leave: (node: ts.Node) => void
		}
	) {
		const { enter, leave } = callback

		traverseNode(sourceFile)

		function traverseNode(node: ts.Node) {
			enter(node)
			ts.forEachChild(node, traverseNode)
			leave(node)
		}
	}

	static posToLoc(sourceFile: ts.SourceFile, pos: number): NodeLocation {
		const lineAndChar = sourceFile.getLineAndCharacterOfPosition(pos)

		return {
			line: lineAndChar.line + 1,
			column: lineAndChar.character
		}
	}

	static isProgramStructureType (node: ts.Node) {
		return ts.isFunctionDeclaration(node) ||
			ts.isFunctionExpression(node) ||
			ts.isArrowFunction(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isConstructorDeclaration(node) ||
			ts.isClassDeclaration(node) ||
			ts.isClassExpression(node)
	}

	/**
	 * Method to transpile a file
	 * it determines the tsconfig to use and transpiles the given file with the compiler options of its tsconfig
	 * 
	 * @param filePath source file to transpile
	 * @param sourceCode source code of the file to transpile
	 * @returns transpiled source code of the given file
	 */

	static transpileCode(filePath: UnifiedPath, sourceCode: string): string {
		const tsconfigFilePath = TypescriptParser.tsConfigFilePathFromFile(filePath.toPlatformString())

		if (!tsconfigFilePath) {
			throw new Error('TypescriptParser.transpileCode: Could not find a tsconfig for: ' + filePath.toPlatformString())
		}

		const tsconfig = TypescriptParser.readConfigFile(tsconfigFilePath)

		if (!tsconfig) {
			throw new Error('TypescriptParser.transpileCode: Could not parse tje tsconfig: ' + tsconfigFilePath)
		}

		const transpiledCode = ts.transpileModule(
			sourceCode,
			{
				fileName: filePath.toString(),
				compilerOptions: tsconfig.options
			}
		)
		return transpiledCode.outputText
	}

	static parseFile(filePath: UnifiedPath) {
		const sourceCode = fs.readFileSync(filePath.toPlatformString()).toString()
		return TypescriptParser.parseSource(filePath, sourceCode)
	}

	static codeToTSSourceFile(
		filePath: UnifiedPath | UnifiedPath_string,
		sourceCode: string,
		scriptKind: 'TSX' | 'TS' = 'TS'
	): ts.SourceFile {
		return ts.createSourceFile(
			filePath.toString(),
			sourceCode,
			ts.ScriptTarget.Latest,
			true, // setParentNodes
			scriptKind === 'TS' ? ts.ScriptKind.TS : ts.ScriptKind.TSX
		)
	}

	static parseSource(
		filePath: UnifiedPath | UnifiedPath_string,
		sourceCode: string,
		scriptKind: 'TSX' | 'TS' = 'TS',
		onDuplicateIdentifier?: OnDuplicateIdentifierCallback
	): ProgramStructureTree {
		return TypescriptParser.parseTSSourceFile(
			filePath,
			TypescriptParser.codeToTSSourceFile(filePath, sourceCode, scriptKind),
			onDuplicateIdentifier
		)
	}

	static parseTSSourceFile(
		filePath: UnifiedPath | UnifiedPath_string,
		sourceFile: ts.SourceFile,
		onDuplicateIdentifier?: OnDuplicateIdentifierCallback
	) {
		let idCounter = 0
		const root: ProgramStructureTree = new ProgramStructureTree(
			idCounter++,
			ProgramStructureTreeType.Root,
			IdentifierType.Name,
			'{root}' as SourceNodeIdentifierPart_string,
			TypescriptParser.posToLoc(sourceFile, 0),
			TypescriptParser.posToLoc(sourceFile, sourceFile.getEnd())
		)
		const stack: TraverseNodeInfo[] = []

		let currentNodeInfo: TraverseNodeInfo = {
			tree: root,
			anonymousFunctionCounter: 0,
			expressionFunctionCounter: 0,
			literalFunctionCounter: 0
		}

		const skippedSourceNodes: ts.Node[] = []
		let skipNext = false
		const enterNode = (node: ts.Node) => {
			if (ts.isCallExpression(node)) {
				if (ts.isIdentifier(node.expression)) {
					if (node.expression.escapedText === '___awaiter') {
						/**
						 * the actual function is wrapped into an generated ___awaiter call like this:
						 * async function test() { console.log('') }
						 * transpiles sometimes to:
						 * test() {
						 * 		__awaiter(this, void 0, void 0, function* () { console.log('') })
						 * }
						 * 
						 * Since the actual function is now wrapped into a call expression,
						 * this will result in a hierarchy like this:
						 * - function:test
						 * 		- functionExpression:anonymous
						 * 
						 * since this happens only through the transpiling
						 * we ignore the next call expression to keep the hirachy like:
						 * - function:test
						 * 
						 */
						skipNext = true
					}
				}
			}

			if (TypescriptParser.isProgramStructureType(node)) {
				if (skipNext) {
					skippedSourceNodes.push(node)
					skipNext = false
					return
				}
				let subTree: ProgramStructureTree | undefined = undefined
				if (ts.isClassDeclaration(node)) {
					if (node.name?.kind === ts.SyntaxKind.Identifier) {
						const className = node.name.escapedText
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.ClassDeclaration,
							IdentifierType.Name,
							('{class:' + className + '}') as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					} else if (TypeScriptHelper.hasDefaultKeywordModifier(node)) {
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.ClassDeclaration,
							IdentifierType.KeyWord,
							('{class:default}') as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					} else {
						LoggerHelper.error(
							'TypescriptParser.parseFile.enterNode (isClassDeclaration): unhandled case: node.name.kind === ' + node.name?.kind, {
								filePath,
								kind: node.name?.kind ? ts.SyntaxKind[node.name?.kind] : undefined,
								pos: node.name ? TypescriptParser.posToLoc(sourceFile, node.name.getStart()) : undefined
							}
						)
						throw new Error('TypescriptParser.parseFile.enterNode (isClassDeclaration): unhandled case: node.name.kind === ' + node.name?.kind)
					}
				}

				if (ts.isClassExpression(node)) {
					if (
						node.parent.kind === ts.SyntaxKind.VariableDeclaration ||
						node.parent.kind === ts.SyntaxKind.PropertyDeclaration ||
						node.parent.kind === ts.SyntaxKind.ParenthesizedExpression
					) {
						let parent = undefined
						let className = undefined
						switch (node.parent.kind) {
							case ts.SyntaxKind.PropertyDeclaration:
								parent = node.parent as ts.PropertyDeclaration
								switch (parent.name.kind) {
									case ts.SyntaxKind.Identifier:
									case ts.SyntaxKind.PrivateIdentifier:
										className = `classExpression:${parent.name.escapedText}`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ClassExpression,
											IdentifierType.Name,
											`{${className}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									case ts.SyntaxKind.StringLiteral:
									case ts.SyntaxKind.FirstLiteralToken:
										className =
											'classExpression:(literal:' +
											`${currentNodeInfo.literalFunctionCounter++})`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ClassExpression,
											IdentifierType.Literal,
											`{${className}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									case ts.SyntaxKind.ComputedPropertyName:
										className =
											'classExpression:(expression:' +
											`${currentNodeInfo.literalFunctionCounter++})`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ClassExpression,
											IdentifierType.Expression,
											`{${className}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									default:
										LoggerHelper.error(
											'TypescriptParser.parseFile.enterNode (isClassExpression: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
											{
												filePath,
												kind: parent.name.kind,
												pos: TypescriptParser.posToLoc(sourceFile, parent.name.getStart())
											}
										)
										throw new Error('TypescriptParser.parseFile.enterNode (isArrowFunction: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
								}
								break
							case ts.SyntaxKind.ParenthesizedExpression:
								className =
									`classExpression:(expression:${currentNodeInfo.literalFunctionCounter++})`
								subTree = new ProgramStructureTree(
									idCounter++,
									ProgramStructureTreeType.ClassExpression,
									IdentifierType.Expression,
									`{${className}}` as SourceNodeIdentifierPart_string,
									TypescriptParser.posToLoc(sourceFile, node.getStart()),
									TypescriptParser.posToLoc(sourceFile, node.getEnd()),
								)
								break
							case ts.SyntaxKind.VariableDeclaration:
								parent = node.parent as ts.VariableDeclaration
								switch (parent.name.kind) {
									case ts.SyntaxKind.Identifier:
										className = `classExpression:${parent.name.escapedText}`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ClassExpression,
											IdentifierType.Name,
											`{${className}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									default:
										LoggerHelper.error(
											'Error: TypescriptParser.parseFile.enterNode',
											filePath,
											TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
										)
										LoggerHelper.error(
											'TypescriptParser.parseFile.enterNode (isClassExpression: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
												filePath,
												kind: node.parent.kind,
												pos: TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
											}
										)
										throw new Error('TypescriptParser.parseFile.enterNode (isClassExpression: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
								}

								parent = node.parent as ts.VariableDeclaration
						}
					} else {
						const className =
							`classExpression:(anonymous:${currentNodeInfo.anonymousFunctionCounter++})`
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.ClassExpression,
							IdentifierType.Anonymous,
							`{${className}}` as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					}
				}

				if (ts.isConstructorDeclaration(node)) {
					subTree = new ProgramStructureTree(
						idCounter++,
						ProgramStructureTreeType.ConstructorDeclaration,
						IdentifierType.Name,
						'{constructor:constructor}' as SourceNodeIdentifierPart_string,
						TypescriptParser.posToLoc(sourceFile, node.getStart()),
						TypescriptParser.posToLoc(sourceFile, node.getEnd()),
					)
				}

				if (ts.isFunctionDeclaration(node)) {
					if (node.name?.kind === ts.SyntaxKind.Identifier) {
						const functionName = node.name.escapedText
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.FunctionDeclaration,
							IdentifierType.Name,
							('{function:' + functionName + '}') as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					} else if (TypeScriptHelper.hasDefaultKeywordModifier(node)) {
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.FunctionDeclaration,
							IdentifierType.KeyWord,
							'{function:default}' as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					}	else {
						LoggerHelper.error(
							'TypescriptParser.parseFile.enterNode (isFunctionDeclaration): unhandled case: node.name.kind === ' + node.name?.kind, {
								filePath,
								kind: node.name?.kind,
								pos: TypescriptParser.posToLoc(sourceFile, node.name?.getStart() || 0)
							}
						)
						throw new Error('TypescriptParser.parseFile.enterNode (isFunctionDeclaration): unhandled case: node.name.kind === ' + node.name?.kind)
					}
				}

				if (ts.isFunctionExpression(node)) {
					const emitHelperName = TypeScriptHelper.getEmitHelperName(node)
					if (emitHelperName !== undefined) {
						const functionName = `functionExpression:${emitHelperName}`
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.FunctionExpression,
							IdentifierType.Name,
							`{${functionName}}` as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					} else {
						if (
							node.parent.kind === ts.SyntaxKind.VariableDeclaration ||
							node.parent.kind === ts.SyntaxKind.PropertyDeclaration ||
							node.parent.kind === ts.SyntaxKind.ParenthesizedExpression
						) {
							let parent = undefined
							let functionName = undefined
							switch (node.parent.kind) {
								case ts.SyntaxKind.PropertyDeclaration:
									parent = node.parent as ts.PropertyDeclaration
									switch (parent.name.kind) {
										case ts.SyntaxKind.Identifier:
										case ts.SyntaxKind.PrivateIdentifier:
											functionName = `functionExpression:${parent.name.escapedText}`
											subTree = new ProgramStructureTree(
												idCounter++,
												ProgramStructureTreeType.FunctionExpression,
												IdentifierType.Name,
												`{${functionName}}` as SourceNodeIdentifierPart_string,
												TypescriptParser.posToLoc(sourceFile, node.getStart()),
												TypescriptParser.posToLoc(sourceFile, node.getEnd()),
											)
											break
										case ts.SyntaxKind.StringLiteral:
										case ts.SyntaxKind.FirstLiteralToken:
											functionName =
												'functionExpression:(literal:' +
												`${currentNodeInfo.literalFunctionCounter++})`
											subTree = new ProgramStructureTree(
												idCounter++,
												ProgramStructureTreeType.FunctionExpression,
												IdentifierType.Literal,
												`{${functionName}}` as SourceNodeIdentifierPart_string,
												TypescriptParser.posToLoc(sourceFile, node.getStart()),
												TypescriptParser.posToLoc(sourceFile, node.getEnd()),
											)
											break
										case ts.SyntaxKind.ComputedPropertyName:
											functionName =
												'functionExpression:(expression:' +
												`${currentNodeInfo.literalFunctionCounter++})`
											subTree = new ProgramStructureTree(
												idCounter++,
												ProgramStructureTreeType.FunctionExpression,
												IdentifierType.Expression,
												`{${functionName}}` as SourceNodeIdentifierPart_string,
												TypescriptParser.posToLoc(sourceFile, node.getStart()),
												TypescriptParser.posToLoc(sourceFile, node.getEnd()),
											)
											break
										default:
											LoggerHelper.error(
												'TypescriptParser.parseFile.enterNode (isFunctionExpression: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
												{
													filePath,
													kind: parent.name.kind,
													pos: TypescriptParser.posToLoc(sourceFile, parent.name.getStart())
												}
											)
											throw new Error('TypescriptParser.parseFile.enterNode (isFunctionExpression: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
									}
									break
								case ts.SyntaxKind.ParenthesizedExpression:
									functionName =
										`functionExpression:(expression:${currentNodeInfo.literalFunctionCounter++})`
									subTree = new ProgramStructureTree(
										idCounter++,
										ProgramStructureTreeType.FunctionExpression,
										IdentifierType.Expression,
										`{${functionName}}` as SourceNodeIdentifierPart_string,
										TypescriptParser.posToLoc(sourceFile, node.getStart()),
										TypescriptParser.posToLoc(sourceFile, node.getEnd()),
									)
									break
								case ts.SyntaxKind.VariableDeclaration:
									parent = node.parent as ts.VariableDeclaration
									switch (parent.name.kind) {
										case ts.SyntaxKind.Identifier:
											functionName = `functionExpression:${parent.name.escapedText}`
											subTree = new ProgramStructureTree(
												idCounter++,
												ProgramStructureTreeType.FunctionExpression,
												IdentifierType.Name,
												`{${functionName}}` as SourceNodeIdentifierPart_string,
												TypescriptParser.posToLoc(sourceFile, node.getStart()),
												TypescriptParser.posToLoc(sourceFile, node.getEnd()),
											)
											break
										default:
											LoggerHelper.error(
												'Error: TypescriptParser.parseFile.enterNode',
												filePath,
												TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
											)
											LoggerHelper.error(
												'TypescriptParser.parseFile.enterNode (isFunctionExpression: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
													filePath,
													kind: node.parent.kind,
													pos: TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
												}
											)
											throw new Error('TypescriptParser.parseFile.enterNode (isFunctionExpression: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
									}

									parent = node.parent as ts.VariableDeclaration
							}
						} else {
							const functionName =
								`functionExpression:(anonymous:${currentNodeInfo.anonymousFunctionCounter++})`
							subTree = new ProgramStructureTree(
								idCounter++,
								ProgramStructureTreeType.FunctionExpression,
								IdentifierType.Anonymous,
								`{${functionName}}` as SourceNodeIdentifierPart_string,
								TypescriptParser.posToLoc(sourceFile, node.getStart()),
								TypescriptParser.posToLoc(sourceFile, node.getEnd()),
							)
						}
					}
				}

				if (ts.isMethodDeclaration(node)) {
					let methodName = ''
					switch (node.name.kind) {
						case ts.SyntaxKind.Identifier:
						case ts.SyntaxKind.PrivateIdentifier:
							methodName = 'method:' + node.name.escapedText.toString()
							subTree = new ProgramStructureTree(
								idCounter++,
								ProgramStructureTreeType.MethodDefinition,
								IdentifierType.Name,
								`{${methodName}}` as SourceNodeIdentifierPart_string,
								TypescriptParser.posToLoc(sourceFile, node.getStart()),
								TypescriptParser.posToLoc(sourceFile, node.getEnd()),
							)
							break
						case ts.SyntaxKind.StringLiteral:
						case ts.SyntaxKind.FirstLiteralToken:
							methodName = `method:(literal:${currentNodeInfo.literalFunctionCounter++})`
							subTree = new ProgramStructureTree(
								idCounter++,
								ProgramStructureTreeType.MethodDefinition,
								IdentifierType.Literal,
								`{${methodName}}` as SourceNodeIdentifierPart_string,
								TypescriptParser.posToLoc(sourceFile, node.getStart()),
								TypescriptParser.posToLoc(sourceFile, node.getEnd()),
							)
							break
						case ts.SyntaxKind.ComputedPropertyName:
							methodName = `method:(expression:${currentNodeInfo.expressionFunctionCounter++})`
							subTree = new ProgramStructureTree(
								idCounter++,
								ProgramStructureTreeType.MethodDefinition,
								IdentifierType.Expression,
								`{${methodName}}` as SourceNodeIdentifierPart_string,
								TypescriptParser.posToLoc(sourceFile, node.getStart()),
								TypescriptParser.posToLoc(sourceFile, node.getEnd()),
							)
							break
						default:
							LoggerHelper.error(
								'TypescriptParser.parseFile.enterNode (isMethodDeclaration): unhandled case: node.name.kind  === ' + node.name?.kind, {
									filePath,
									kind: node.name.kind,
									pos: TypescriptParser.posToLoc(sourceFile, node.name.getStart())
								}
							)
							throw new Error('TypescriptParser.parseFile.enterNode (isMethodDeclaration): unhandled case: node.name.kind  === ' + node.name?.kind)
					}
				}

				if (ts.isArrowFunction(node)) {
					if (
						node.parent.kind === ts.SyntaxKind.VariableDeclaration ||
						node.parent.kind === ts.SyntaxKind.PropertyDeclaration ||
						node.parent.kind === ts.SyntaxKind.ParenthesizedExpression
					) {
						let parent = undefined
						let functionName = undefined
						switch (node.parent.kind) {
							case ts.SyntaxKind.PropertyDeclaration:
								parent = node.parent as ts.PropertyDeclaration
								switch (parent.name.kind) {
									case ts.SyntaxKind.Identifier:
									case ts.SyntaxKind.PrivateIdentifier:
										functionName = `functionExpression:${parent.name.escapedText}`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ArrowFunctionExpression,
											IdentifierType.Name,
											`{${functionName}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									case ts.SyntaxKind.StringLiteral:
									case ts.SyntaxKind.FirstLiteralToken:
										functionName =
											`functionExpression:(literal:${currentNodeInfo.literalFunctionCounter++})`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ArrowFunctionExpression,
											IdentifierType.Literal,
											`{${functionName}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									case ts.SyntaxKind.ComputedPropertyName:
										functionName =
										`functionExpression:(expression:${currentNodeInfo.literalFunctionCounter++})`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ArrowFunctionExpression,
											IdentifierType.Expression,
											`{${functionName}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									default:
										LoggerHelper.error(
											'TypescriptParser.parseFile.enterNode (isArrowFunction: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind,
											{
												filePath,
												kind: ts.SyntaxKind[parent.name.kind],
												pos: TypescriptParser.posToLoc(sourceFile, parent.name.getStart())
											}
										)
										throw new Error('TypescriptParser.parseFile.enterNode (isArrowFunction: PropertyDeclaration): unhandled case: parent.name.kind === ' + parent.name.kind)
								}
								break
							case ts.SyntaxKind.ParenthesizedExpression:
								functionName =
								`functionExpression:(expression:${currentNodeInfo.literalFunctionCounter++})`
								subTree = new ProgramStructureTree(
									idCounter++,
									ProgramStructureTreeType.ArrowFunctionExpression,
									IdentifierType.Expression,
									`{${functionName}}` as SourceNodeIdentifierPart_string,
									TypescriptParser.posToLoc(sourceFile, node.getStart()),
									TypescriptParser.posToLoc(sourceFile, node.getEnd()),
								)
								break
							case ts.SyntaxKind.VariableDeclaration:
								parent = node.parent as ts.VariableDeclaration
								switch (parent.name.kind) {
									case ts.SyntaxKind.Identifier:
										functionName = `functionExpression:${parent.name.escapedText}`
										subTree = new ProgramStructureTree(
											idCounter++,
											ProgramStructureTreeType.ArrowFunctionExpression,
											IdentifierType.Name,
											`{${functionName}}` as SourceNodeIdentifierPart_string,
											TypescriptParser.posToLoc(sourceFile, node.getStart()),
											TypescriptParser.posToLoc(sourceFile, node.getEnd()),
										)
										break
									default:
										LoggerHelper.error(
											'Error: TypescriptParser.parseFile.enterNode',
											filePath,
											TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
										)
										LoggerHelper.error(
											'TypescriptParser.parseFile.enterNode (isArrowFunction: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind, {
												filePath,
												kind: ts.SyntaxKind[node.parent.kind],
												pos: TypescriptParser.posToLoc(sourceFile, node.parent.getStart())
											}
										)
										throw new Error('TypescriptParser.parseFile.enterNode (isArrowFunction: VariableDeclaration): unhandled case: node.parent.kind  === ' + node.parent.kind)
								}

								parent = node.parent as ts.VariableDeclaration
						}
					} else {
						const functionName =
						`functionExpression:(anonymous:${currentNodeInfo.anonymousFunctionCounter++})`
						subTree = new ProgramStructureTree(
							idCounter++,
							ProgramStructureTreeType.ArrowFunctionExpression,
							IdentifierType.Anonymous,
							`{${functionName}}` as SourceNodeIdentifierPart_string,
							TypescriptParser.posToLoc(sourceFile, node.getStart()),
							TypescriptParser.posToLoc(sourceFile, node.getEnd()),
						)
					}
				}

				if (subTree) {
					if (subTree.identifier) {
						const found = currentNodeInfo.tree.children.get(subTree.identifier)
						if (found !== undefined && onDuplicateIdentifier !== undefined) {
							const identifierPath = stack.map(
								(n) => {
									return n.tree.identifier
								}
							)

							onDuplicateIdentifier(
								filePath,
								(node as any),
								[...identifierPath, subTree.identifier].join('.'),
								{
									begin: subTree.beginLoc,
									end: subTree.endLoc
								},
								{
									begin: found.beginLoc,
									end: found.endLoc
								}
							)
						}
						currentNodeInfo.tree.children.set(subTree.identifier, subTree)
					}
					// store last visited node 
					stack.push(currentNodeInfo)

					// set current node to newly traversed node
					currentNodeInfo = {
						tree: subTree,
						anonymousFunctionCounter: 0,
						expressionFunctionCounter: 0,
						literalFunctionCounter: 0
					}
				} else {
					throw new Error('TypescriptParser.parseFile: subTree is undefined, unexpected behaviour')
				}
			}
		}

		const leaveNode = (node: ts.Node) => {
			if (TypescriptParser.isProgramStructureType(node)) {
				const found = skippedSourceNodes.indexOf(node)
				if (found > -1) {
					skippedSourceNodes.splice(found, 1)
					return
				}
				const nodeInfo = stack.pop()
				if (nodeInfo) {
					currentNodeInfo = nodeInfo
				}
			}
		}

		TypescriptParser.traverseSourceFile(sourceFile, { enter: enterNode, leave: leaveNode })

		return root
	}

	/**
	 * Parses a given tsconfig file
	 * 
	 * @param configFileName Path to the tsconfig to parser
	 * @returns Parsed Config
	 */
	static readConfigFile(configFileName: string): ts.ParsedCommandLine | undefined {
		// Read config file
		const configFileText = fs.readFileSync(configFileName).toString()

		// Parse JSON, after removing comments. Just fancier JSON.parse
		const result = ts.parseConfigFileTextToJson(configFileName, configFileText)
		const configObject = result.config
		if (!configObject) {
			LoggerHelper.error(
				`TypescriptParser.readConfigFile could not parse the config file: ${configFileName}`
			)
			return undefined
		}

		// Extract config information
		const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName))
		if (configParseResult.errors.length > 0) {
			LoggerHelper.error(
				`TypescriptParser.readConfigFile errors while parsing the config file: ${configFileName}`,
				JSON.stringify(configParseResult.errors, undefined, 2)
			)
			return undefined
		}
		return configParseResult
	}

	/**
	 * Resolves the tsconfig for a given file
	 * 
	 * @param path Path of the file to compile
	 * @returns The parsed typescript config that is used to compile the given file
	 */
	static tsConfigFilePathFromFile(path: string): string | undefined {
		const configPath = ts.findConfigFile(
			path, // search path
			ts.sys.fileExists,
			'tsconfig.json'
		)

		if (!configPath) {
			return undefined
		}

		return configPath
	}
}

