import * as fs from 'fs'
import * as path from 'path'

import * as ts from 'typescript'

import {
	ClassDeclarationHelper,
	ClassExpressionHelper,
	ConstructorDeclarationHelper,
	FunctionDeclarationHelper,
	FunctionExpressionHelper,
	MethodDeclarationHelper,
	ArrowFunctionHelper,
	ScopeHelper,
	SkipHelper
} from './index'

import { TypescriptHelper } from './TypescriptHelper'
import { TraverseNodeInfo } from './TraverseNodeInfo'

import { LoggerHelper } from '../LoggerHelper'
import { ProgramStructureTree } from '../../model/ProgramStructureTree'
import { UnifiedPath } from '../../system/UnifiedPath'
// Types
import {
	ProgramStructureTreeType,
	NodeLocation,
	IdentifierType,
	UnifiedPath_string,
	SourceNodeIdentifierPart_string
} from '../../types'

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

	static isProgramStructureType (node: ts.Node) {
		return TypescriptParser.isExecutableScope(node) ||
			TypescriptParser.isHierarchyLayer(node)
	}

	/*
		Only the following node types are considered a executable scope.
		Scopes like `if` statements are only used for hierarchy and not for execution.
	*/
	static isExecutableScope(node: ts.Node) {
		return ts.isFunctionDeclaration(node) ||
			ts.isFunctionExpression(node) ||
			ts.isArrowFunction(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isConstructorDeclaration(node) ||
			ts.isClassDeclaration(node) ||
			ts.isClassExpression(node)
	}

	/*
		The following node types are considered hierarchy layers.
		They are only used to create a hierarchy in the program structure tree but cannot be a leaf node.
	*/
	static isHierarchyLayer(node: ts.Node) {
		return ts.isObjectLiteralExpression(node)
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
		const root: ProgramStructureTree = new ProgramStructureTree(
			null,
			0,
			ProgramStructureTreeType.Root,
			IdentifierType.Name,
			'{root}' as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, 0),
			TypescriptHelper.posToLoc(sourceFile, sourceFile.getEnd())
		)
		const stack: TraverseNodeInfo[] = []

		let currentTraverseNodeInfo: TraverseNodeInfo = {
			node: sourceFile,
			filePath,
			idCounter: 1, // root node has id 0
			tree: root,
			anonymousScopeCounter: 0,
			anonymousFunctionCounter: 0,
			expressionFunctionCounter: 0,
			literalFunctionCounter: 0
		}

		let skipNext = false

		const addSubTree = (
			node: ts.Node,
			subTree: ProgramStructureTree,
			tree: ProgramStructureTree,
		) => {
			const found = tree.children.get(subTree.identifier)
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

				// throw new Error(
				// 	'TypescriptParser.parseFile: duplicate function identifier definition: ' +
				// 	subTree.identifier + '\n' +
				// 	JSON.stringify({
				// 		filePath,
				// 		identifierPath: [...identifierPath, subTree.identifier].join('.'),
				// 		loc: {
				// 			begin: subTree.beginLoc,
				// 			end: subTree.endLoc
				// 		},
				// 		previouslyFound: {
				// 			loc: {
				// 				begin: found.beginLoc,
				// 				end: found.endLoc
				// 			}
				// 		}
				// 	}, undefined, 2)
				// )
			}
			tree.children.set(subTree.identifier, subTree)
		}

		const enterNode = (node: ts.Node) => {
			if (SkipHelper.nodeShouldBeSkipped(node)) {
				skipNext = true
			}

			if (TypescriptParser.isProgramStructureType(node)) {
				if (skipNext) {
					skipNext = false
					return
				}
				const subTree = TypescriptParser.parseNode(
					node,
					sourceFile,
					currentTraverseNodeInfo
				)
				
				// if (ts.isBlock(node)) {
					
				// }

				if (subTree) {
					// adds the subtree to the current tree
					addSubTree(
						node,
						subTree,
						currentTraverseNodeInfo.tree
					)
					// store last visited node 
					stack.push(currentTraverseNodeInfo)

					// set current node to newly traversed node
					currentTraverseNodeInfo = {
						node,
						filePath,
						idCounter: currentTraverseNodeInfo.idCounter,
						tree: subTree,
						anonymousScopeCounter: 0,
						anonymousFunctionCounter: 0,
						expressionFunctionCounter: 0,
						literalFunctionCounter: 0
					}
				} else {
					LoggerHelper.error(
						'TypescriptParser.parseFile: subTree is undefined, unexpected behaviour',
						JSON.stringify({
							filePath,
							node: ts.SyntaxKind[node.kind],
							code: node.getText(sourceFile)
						}, undefined, 2)
					)
					throw new Error('TypescriptParser.parseFile: subTree is undefined, unexpected behaviour')
				}
			}
		}

		const leaveNode = (node: ts.Node) => {
			if (currentTraverseNodeInfo.node === node) {
				TypescriptParser.clearEmptyScopes(currentTraverseNodeInfo)
				const nodeInfo = stack.pop()
				if (nodeInfo) {
					currentTraverseNodeInfo = nodeInfo
				}
			}
		}

		TypescriptParser.traverseSourceFile(sourceFile, { enter: enterNode, leave: leaveNode })

		return root
	}

	static clearEmptyScopes(
		traverseNodeInfo: TraverseNodeInfo
	) {
		if (
			traverseNodeInfo.tree.type === ProgramStructureTreeType.Scope &&
			traverseNodeInfo.tree.children.size === 0
		) {
			// remove empty scopes since scopes are only used as a hierarchy level to distinguish between
			// functions, methods, etc.
			traverseNodeInfo.tree.parent?.children.delete(traverseNodeInfo.tree.identifier)
		}
	}

	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree | undefined {
		if (ts.isClassDeclaration(node)) {
			return ClassDeclarationHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isClassExpression(node)) {
			return ClassExpressionHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isConstructorDeclaration(node)) {
			return ConstructorDeclarationHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isFunctionDeclaration(node)) {
			return FunctionDeclarationHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isFunctionExpression(node)) {
			return FunctionExpressionHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isMethodDeclaration(node)) {
			return MethodDeclarationHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		if (ts.isArrowFunction(node)) {
			return ArrowFunctionHelper.parseNode(
				node,
				sourceFile,
				traverseNodeInfo
			)
		}

		const subTree = ScopeHelper.parseNode(
			node,
			sourceFile,
			traverseNodeInfo
		)
		if (subTree !== undefined) {
			return subTree
		}

		return undefined
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

