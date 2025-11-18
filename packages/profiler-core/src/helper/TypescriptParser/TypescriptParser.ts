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
	GetAccessorDeclarationHelper,
	SetAccessorDeclarationHelper,
	ArrowFunctionHelper,
	SkipHelper,
	ScopeHelper,
	ObjectLiteralExpressionHelper,
	BlockHelper,
	ClassStaticBlockDeclarationHelper,
	ForStatementHelper,
	IfStatementHelper,
	WhileStatementHelper,
	TryStatementHelper,
	SwitchStatementHelper,
	ModuleDeclarationHelper,
	DuplicateIdentifierHelper
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	[GetAccessorDeclarationHelper.syntaxKind]: GetAccessorDeclarationHelper.parseNode,
	[SetAccessorDeclarationHelper.syntaxKind]: SetAccessorDeclarationHelper.parseNode,
	[ArrowFunctionHelper.syntaxKind]: ArrowFunctionHelper.parseNode,
	[ObjectLiteralExpressionHelper.syntaxKind]: ObjectLiteralExpressionHelper.parseNode,
	[IfStatementHelper.syntaxKind]: IfStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[0]]: ForStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[1]]: ForStatementHelper.parseNode,
	[ForStatementHelper.syntaxKind[2]]: ForStatementHelper.parseNode,
	[WhileStatementHelper.syntaxKind[0]]: WhileStatementHelper.parseNode,
	[WhileStatementHelper.syntaxKind[1]]: WhileStatementHelper.parseNode,
	[TryStatementHelper.syntaxKind]: TryStatementHelper.parseNode,
	[BlockHelper.syntaxKind]: BlockHelper.parseNode,
	[ClassStaticBlockDeclarationHelper.syntaxKind]: ClassStaticBlockDeclarationHelper.parseNode,
	[SwitchStatementHelper.syntaxKind]: SwitchStatementHelper.parseNode,
	[ModuleDeclarationHelper.syntaxKind]: ModuleDeclarationHelper.parseNode
}

export const HANDLE_DUPLICATE_IDENTIFIERS: Record<string, (
	tree: ProgramStructureTree,
	node: ts.Node
) => boolean> = {
	[ProgramStructureTreeType.FunctionDeclaration]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.MethodDefinition]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.GetAccessorDeclaration]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.SetAccessorDeclaration]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.FunctionExpression]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.ClassExpression]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.ObjectLiteralExpression]: DuplicateIdentifierHelper.handleDuplicateIdentifier,
	[ProgramStructureTreeType.SwitchCaseClause]: DuplicateIdentifierHelper.handleDuplicateIdentifier
}

export class TypescriptParser {
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
			throw new Error(
				'TypescriptParser.transpileCode: Could not find a tsconfig for: ' +
				filePath.toPlatformString()
			)
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
	): ProgramStructureTree<ProgramStructureTreeType.Root> {
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
	): ProgramStructureTree<ProgramStructureTreeType.Root> {
		const root = new ProgramStructureTree(
			null,
			0,
			ProgramStructureTreeType.Root,
			IdentifierType.Name,
			'{root}' as SourceNodeIdentifierPart_string,
			TypescriptHelper.posToLoc(sourceFile, 0),
			TypescriptHelper.posToLoc(sourceFile, sourceFile.getEnd())
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
			if (found !== undefined) {
				const duplicatesAreExpected =
					HANDLE_DUPLICATE_IDENTIFIERS[subTree.type] !== undefined &&
					HANDLE_DUPLICATE_IDENTIFIERS[subTree.type](subTree, node)

				if (!duplicatesAreExpected && onDuplicateIdentifier !== undefined){
					const identifier = subTree.parent.identifierPath() + '.' + subTree.identifier
					onDuplicateIdentifier(
						filePath,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				}
			}
			parentTraverseNodeInfo.counters.childrenCounter++
			subTree.parent.children.set(subTree.identifier, subTree)
		}

		const enterNode = (
			parentTraverseNodeInfo: TraverseNodeInfo,
			node: ts.Node,
			depth: number
		): TraverseNodeInfo => {
			let currentTraverseNodeInfo = parentTraverseNodeInfo
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
				return revertToTraverseNodeInfo
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
				return currentTraverseNodeInfo
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
			return currentTraverseNodeInfo
		}

		const leaveNode = (
			currentTraverseNodeInfo: TraverseNodeInfo,
			node: ts.Node
		) => {
			let traverseNodeInfo = currentTraverseNodeInfo
			while (
				traverseNodeInfo.parent !== null &&
				traverseNodeInfo.node === node
			) {
				if (
					traverseNodeInfo.isTreeResolved() ||
					traverseNodeInfo.counters.childrenCounter !== 0 ||
					traverseNodeInfo.shouldResolveTreeWithZeroChildren()
				) {
					addSubTree(
						node,
						traverseNodeInfo,
						traverseNodeInfo.parent
					)
				}
				traverseNodeInfo = traverseNodeInfo.parent
			}
			return traverseNodeInfo
		}

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

		type StackFrame = {
			depth: number,
			node: ts.Node,
			visited: boolean
		}

		const stack: StackFrame[] = [{ depth: 0, node: sourceFile, visited: false }]
		while ( stack.length > 0) {
			const currentStackFrame = stack[stack.length - 1]

			if (!currentStackFrame.visited) {
				currentTraverseNodeInfo = enterNode(
					currentTraverseNodeInfo,
					currentStackFrame.node,
					currentStackFrame.depth
				)
				currentStackFrame.visited = true
				const insertPos = stack.length
				ts.forEachChild(currentStackFrame.node, (child) => {
					stack.splice(insertPos, 0, { depth: currentStackFrame.depth + 1, node: child, visited: false })
				})
			} else {
				currentTraverseNodeInfo = leaveNode(currentTraverseNodeInfo, currentStackFrame.node)
				stack.pop()
			}
		}

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

