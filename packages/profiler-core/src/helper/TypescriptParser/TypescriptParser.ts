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
	ForStatementHelper,
	IfStatementHelper,
	SwitchStatementHelper,
	ModuleDeclarationHelper
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

const PARSE_NODE_FUNCTIONS: Record<number, (
	...args: any
) => {
	resolve(): ProgramStructureTree,
	resolveWithNoChildren?: true
} | null> = {
	[ClassDeclarationHelper.syntaxKind]: ClassDeclarationHelper.parseNode,
	[ClassExpressionHelper.syntaxKind]: ClassExpressionHelper.parseNode,
	[ConstructorDeclarationHelper.syntaxKind]: ConstructorDeclarationHelper.parseNode,
	[FunctionDeclarationHelper.syntaxKind]: FunctionDeclarationHelper.parseNode,
	[FunctionExpressionHelper.syntaxKind]: FunctionExpressionHelper.parseNode,
	[MethodDeclarationHelper.syntaxKind]: MethodDeclarationHelper.parseNode,
	[ArrowFunctionHelper.syntaxKind]: ArrowFunctionHelper.parseNode,
	[ObjectLiteralExpressionHelper.syntaxKind]: ObjectLiteralExpressionHelper.parseNode,
	[IfStatementHelper.syntaxKind]: IfStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[0]]: ForStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[1]]: ForStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[2]]: ForStatementHelper.parseNode,
	[SwitchStatementHelper.syntaxKind]: SwitchStatementHelper.parseNode,
	[ModuleDeclarationHelper.syntaxKind]: ModuleDeclarationHelper.parseNode
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
			enter: (node: ts.Node, depth: number) => void,
			leave: (node: ts.Node, depth: number) => void
		}
	) {
		const { enter, leave } = callback

		traverseNode(0, sourceFile)

		function traverseNode(depth: number, node: ts.Node) {
			enter(node, depth)
			ts.forEachChild(node, traverseNode.bind(null, depth + 1))
			leave(node, depth)
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

		let currentTraverseNodeInfo = new TraverseNodeInfo(
			null,
			sourceFile,
			filePath,
			{
				resolve() {
					return root
				}
			}
		)

		const addSubTree = (
			node: ts.Node,
			currentTraverseNodeInfo: TraverseNodeInfo,
			parentTraverseNodeInfo: TraverseNodeInfo,
		) => {
			const subTree = currentTraverseNodeInfo.resolvedTree()
			if (subTree.parent === null) {
				throw new Error(
					'TypescriptParser.parseFile: subTree.parent is null, this should never happen'
				)
			}
			const found = subTree.parent.children.get(subTree.identifier)
			if (found !== undefined && onDuplicateIdentifier !== undefined) {
				const identifier = subTree.parent.identifierPath() + '.' + subTree.identifier

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
			parentTraverseNodeInfo.counters.childrenCounter++
			subTree.parent.children.set(subTree.identifier, subTree)
		}

		const enterNode = (node: ts.Node, depth: number) => {
			const revertToTraverseNodeInfo = SkipHelper.nodeShouldBeSkipped(
				node,
				sourceFile,
				currentTraverseNodeInfo,
				depth
			)
			if (revertToTraverseNodeInfo !== undefined) {
				// skip this node and revert to a previous traverse node info
				// the revert is needed if multiple nodes are skipped in a row (that where previously traversed)
				// but the necessity of skipping was determined with the current node
				currentTraverseNodeInfo = revertToTraverseNodeInfo
				return
			}

			const intermediateNode = ScopeHelper.parseIntermediateNode(node, sourceFile, currentTraverseNodeInfo)
			if (intermediateNode !== undefined) {
				currentTraverseNodeInfo = new TraverseNodeInfo(
					currentTraverseNodeInfo, // store last visited node
					node,
					filePath,
					intermediateNode
				)
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

			if (subTree) {
				// set current node to newly traversed node
				currentTraverseNodeInfo = new TraverseNodeInfo(
					currentTraverseNodeInfo, // store last visited node
					node,
					filePath,
					subTree
				)
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
				currentTraverseNodeInfo.parent !== null &&
				currentTraverseNodeInfo.node === node
			) {
				if (
					currentTraverseNodeInfo.isTreeResolved() ||
					currentTraverseNodeInfo.counters.childrenCounter !== 0 ||
					currentTraverseNodeInfo.shouldResolveTreeWithZeroChildren()
				) {
					addSubTree(
						node,
						currentTraverseNodeInfo,
						currentTraverseNodeInfo.parent
					)
				}
				currentTraverseNodeInfo = currentTraverseNodeInfo.parent
			}
		}

		TypescriptParser.traverseSourceFile(sourceFile, { enter: enterNode, leave: leaveNode })

		return root
	}

	static parseNode(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): ProgramStructureTree | {
			resolve(): ProgramStructureTree,
			resolveWithNoChildren?: true
		} | null {
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

