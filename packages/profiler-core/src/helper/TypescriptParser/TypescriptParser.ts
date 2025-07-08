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
	SkipHelper,
	ScopeHelper,
	ObjectLiteralExpressionHelper,
	IfStatementHelper,
	SwitchStatementHelper,
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

const PARSE_NODE_FUNCTIONS = {
	[ClassDeclarationHelper.syntaxKind]: ClassDeclarationHelper.parseNode,
	[ClassExpressionHelper.syntaxKind]: ClassExpressionHelper.parseNode,
	[ConstructorDeclarationHelper.syntaxKind]: ConstructorDeclarationHelper.parseNode,
	[FunctionDeclarationHelper.syntaxKind]: FunctionDeclarationHelper.parseNode,
	[FunctionExpressionHelper.syntaxKind]: FunctionExpressionHelper.parseNode,
	[MethodDeclarationHelper.syntaxKind]: MethodDeclarationHelper.parseNode,
	[ArrowFunctionHelper.syntaxKind]: ArrowFunctionHelper.parseNode,
	[ObjectLiteralExpressionHelper.syntaxKind]: ObjectLiteralExpressionHelper.parseNode,
	[IfStatementHelper.syntaxKind]: IfStatementHelper.parseNode,
	[SwitchStatementHelper.syntaxKind]: SwitchStatementHelper.parseNode,
}

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

		let currentTraverseNodeInfo: TraverseNodeInfo = {
			parent: null,
			node: sourceFile,
			filePath,
			idCounter: 1, // root node has id 0
			tree: root,
			ifStatementCounter: 0,
			switchCounter: 0,
			anonymousScopeCounter: 0,
			anonymousFunctionCounter: 0,
			expressionFunctionCounter: 0,
			literalFunctionCounter: 0
		}

		const addSubTree = (
			node: ts.Node,
			subTree: ProgramStructureTree,
			tree: ProgramStructureTree,
		) => {
			const found = tree.children.get(subTree.identifier)
			if (found !== undefined && onDuplicateIdentifier !== undefined) {
				const identifier = tree.identifierPath() + '.' + subTree.identifier

				onDuplicateIdentifier(
					filePath,
					(node as any),
					identifier,
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
				return
			}

			const intermediateNode = ScopeHelper.parseIntermediateNode(node, sourceFile, currentTraverseNodeInfo)
			if (intermediateNode !== undefined) {
				// if the node is an if-case, we add the if case as an intermediate scope
				addSubTree(
					node,
					intermediateNode,
					currentTraverseNodeInfo.tree
				)
				currentTraverseNodeInfo = {
					parent: currentTraverseNodeInfo, // store last visited node
					node,
					filePath,
					idCounter: currentTraverseNodeInfo.idCounter,
					tree: intermediateNode,
					ifStatementCounter: 0,
					switchCounter: 0,
					anonymousScopeCounter: 0,
					anonymousFunctionCounter: 0,
					expressionFunctionCounter: 0,
					literalFunctionCounter: 0
				}
			}

			const subTree = TypescriptParser.parseNode(
				node,
				sourceFile,
				currentTraverseNodeInfo
			)

			if (subTree === null) {
				// there is no parser for this node type
				return
			}
			
			// if (ts.isBlock(node)) {
				
			// }

			if (subTree) {
				// adds the subtree to the current tree
				addSubTree(
					node,
					subTree,
					currentTraverseNodeInfo.tree
				)

				// set current node to newly traversed node
				currentTraverseNodeInfo = {
					parent: currentTraverseNodeInfo, // store last visited node
					node,
					filePath,
					idCounter: currentTraverseNodeInfo.idCounter,
					tree: subTree,
					ifStatementCounter: 0,
					switchCounter: 0,
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

		const leaveNode = (node: ts.Node) => {
			while (
				currentTraverseNodeInfo.node !== sourceFile &&
				currentTraverseNodeInfo.node === node
			) {
				ScopeHelper.clearEmptyScopes(currentTraverseNodeInfo)
				if (currentTraverseNodeInfo.parent !== null) {
					currentTraverseNodeInfo = currentTraverseNodeInfo.parent
				}
			}
		}

		TypescriptParser.traverseSourceFile(sourceFile, { enter: enterNode, leave: leaveNode })

		return root
	}

	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree | null {
		const parseNodeFunction = PARSE_NODE_FUNCTIONS[node.kind]
		if (parseNodeFunction !== undefined) {
			return parseNodeFunction(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				node as any,
				sourceFile,
				traverseNodeInfo
			)
		}

		return null
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

