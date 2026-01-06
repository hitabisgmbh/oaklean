import path from 'path'

import { NullableMappedPosition } from 'source-map'

import { LoggerHelper } from './LoggerHelper'
import { TypescriptParser } from './TypescriptParser'
import { UrlProtocolHelper } from './UrlProtocolHelper'
import { NodeModuleUtils } from './NodeModuleUtils'
import { CPUProfileSourceLocation } from './CPUProfile/CPUProfileSourceLocation'
import { ExternalResourceHelper } from './ExternalResourceHelper'

import { UNKNOWN_SCRIPTS_FOLDER_NAME } from '../constants'
import { SourceMap } from '../model/SourceMap'
import { NodeModule } from '../model/NodeModule'
import { ProgramStructureTree } from '../model/ProgramStructureTree'
import { UnifiedPath } from '../system/UnifiedPath'
import {
	UnifiedPath_string,
	ResolvedSourceNodeLocation,
	ProgramStructureTreeType
} from '../types'

type ResolveFunctionIdentifierResult = {
	sourceNodeLocation: ResolvedSourceNodeLocation,
	functionIdentifierPresentInOriginalFile: boolean,
	nodeModule: NodeModule | null
	relativeNodeModulePath: UnifiedPath | null
}

type NodeModulePerFilePathCacheResult = ReturnType<typeof NodeModuleUtils.nodeModuleFromFilePath>

/**
 * This helper resolves a function identifier from a CPU profile's source location.
 * It does so by requesting the executed code from the Node engine and parsing it.
 * If the requested code contains a source map, it attempts to resolve the original source location.
 * 
 * Additionally, it checks whether the executed code is part of a Node module.
 * If so, it determines the associated Node module.
 */
export class ResolveFunctionIdentifierHelper {
	public hideOriginalSourceFileNotExistErrors = true

	private rootDir: UnifiedPath
	private externalResourceHelper: ExternalResourceHelper

	// script id -> PST
	private PSTperNodeScript: Map<string, ProgramStructureTree<ProgramStructureTreeType.Root>>
	// file path -> PST
	private PSTperOriginalFile: Map<UnifiedPath_string, ProgramStructureTree<ProgramStructureTreeType.Root> | null>
	// cpu profile source location id -> cached ResolveFunctionIdentifierResult
	private functionIdentifierCache: Map<number, ResolveFunctionIdentifierResult>
	
	private _nodeModulePerFileCache: Map<UnifiedPath_string, NodeModulePerFilePathCacheResult>

	constructor(
		rootDir: UnifiedPath,
		externalResourceHelper: ExternalResourceHelper
	) {
		this.rootDir = rootDir
		this.externalResourceHelper = externalResourceHelper
		this.PSTperNodeScript = new Map()
		this.PSTperOriginalFile = new Map()
		this.functionIdentifierCache = new Map()
		this._nodeModulePerFileCache = new Map()
	}

	/**
	 * Adds a caching layer to the NodeModuleUtils.nodeModuleFromFilePath function
	 */
	private nodeModuleFromFilePath(
		relativeFilePath: UnifiedPath
	): NodeModulePerFilePathCacheResult {
		let cacheEntry = this._nodeModulePerFileCache.get(relativeFilePath.toString())
		if (cacheEntry !== undefined) {
			return cacheEntry
		}

		cacheEntry = NodeModuleUtils.nodeModuleFromFilePath(
			this.externalResourceHelper,
			relativeFilePath
		)
		this._nodeModulePerFileCache.set(relativeFilePath.toString(), cacheEntry)

		return cacheEntry
	}

	async resolveFunctionIdentifier(
		sourceLocation: CPUProfileSourceLocation
	): Promise<ResolveFunctionIdentifierResult> {
		// check wether the given source location was already resolved by checking the cache
		const functionIdentifierCacheResult = this.functionIdentifierCache.get(sourceLocation.index)
		if (functionIdentifierCacheResult !== undefined) {
			return functionIdentifierCacheResult
		}

		let programStructureTreeNodeScript:
			| ProgramStructureTree<ProgramStructureTreeType.Root>
			| undefined
			= this.PSTperNodeScript.get(sourceLocation.scriptID)
		let programStructureTreeOriginal:
			| ProgramStructureTree<ProgramStructureTreeType.Root>
			| undefined
			| null =
			undefined
		const { lineNumber, columnNumber } = sourceLocation.sourceLocation
		let functionIdentifierPresentInOriginalFile = true
		let sourceNodeLocation: ResolvedSourceNodeLocation | undefined = undefined
		let originalSourceFileNotFoundError: object | undefined = undefined

		if (programStructureTreeNodeScript === undefined) {
			// request source code from the node engine
			// (it is already transformed event if it is the original file path)
			const sourceCode = await this.externalResourceHelper.sourceCodeFromScriptID(sourceLocation.scriptID)
			if (sourceCode === null) {
				throw new Error(
					'ResolveFunctionIdentifierHelper.resolveFunctionIdentifier: sourceCode should not be null' +
					`scriptID: ${sourceLocation.scriptID}` +
					` (${sourceLocation.absoluteUrl.toPlatformString()})`
				)
			}
			programStructureTreeNodeScript = TypescriptParser.parseSource(
				sourceLocation.absoluteUrl,
				sourceCode
			)
			this.PSTperNodeScript.set(sourceLocation.scriptID, programStructureTreeNodeScript)
		}

		// function identifier of the executed source code
		const functionIdentifier = programStructureTreeNodeScript.identifierBySourceLocation(
			{ line: lineNumber, column: columnNumber }
		)

		const sourceMap = await this.externalResourceHelper.sourceMapFromScriptID(
			sourceLocation.scriptID,
			sourceLocation.absoluteUrl
		)
		const originalPosition = sourceMap !== null ? await ResolveFunctionIdentifierHelper.
			resolveMappedLocationFromSourceMap(
				programStructureTreeNodeScript,
				sourceMap,
				lineNumber,
				columnNumber
			) : undefined

		if (
			originalPosition && 
			originalPosition.source !== null && 
			originalPosition.line !== null && 
			originalPosition.column !== null
		) {
			const {
				url: originalPositionPath,
				protocol: urlProtocol
			} = UrlProtocolHelper.webpackSourceMapUrlToOriginalUrl(
				this.rootDir,
				originalPosition.source
			)
			const absoluteOriginalSourcePath = originalPositionPath.isRelative() ? new UnifiedPath(
				path.resolve(path.join(path.dirname(
					sourceLocation.absoluteUrl.toString()),
				originalPositionPath.toString()))
			) : originalPositionPath

			const relativeOriginalSourcePath = this.rootDir.pathTo(absoluteOriginalSourcePath)

			programStructureTreeOriginal = this.PSTperOriginalFile.get(
				relativeOriginalSourcePath.toString()
			)
			if (programStructureTreeOriginal === undefined) {
				try {
					// found the original source file from the source map but it is not yet parsed
					programStructureTreeOriginal = this.externalResourceHelper.parseFile(
						relativeOriginalSourcePath,
						absoluteOriginalSourcePath
					)
					this.PSTperOriginalFile.set(
						relativeOriginalSourcePath.toString(),
						programStructureTreeOriginal
					)
				} catch {
					// could not parse original source file,
					// sometimes WebFrameworks include sourcemaps that point to e.g. .svg files
					programStructureTreeOriginal = undefined
				}
			}
			if (programStructureTreeOriginal !== null) {
				if (programStructureTreeOriginal !== undefined) {
					const originalFunctionIdentifier = programStructureTreeOriginal.identifierBySourceLocation(
						{ line: originalPosition.line, column: originalPosition.column }
					)
					functionIdentifierPresentInOriginalFile = programStructureTreeOriginal.sourceLocationOfIdentifier(
						functionIdentifier
					) !== null
					sourceNodeLocation = {
						relativeFilePath: relativeOriginalSourcePath,
						functionIdentifier: originalFunctionIdentifier
					}
				}
			} else {
				if (urlProtocol === 'webpack' || urlProtocol === 'webpack-internal') {
					originalSourceFileNotFoundError = {
						originalPositionSource: originalPosition.source,
						relativeOriginalSourcePath: relativeOriginalSourcePath.toString(),
						absoluteOriginalSourcePath: absoluteOriginalSourcePath.toString(),
						originalPositionPath: originalPositionPath.toString()
					}
				}
			}
		} else {
			if (sourceMap) {
				// there is a sourcemap but the original position could not be resolved
				functionIdentifierPresentInOriginalFile = false
			}
		}

		if (sourceNodeLocation === undefined) {
			// if the executed source code is original, has no source map
			// or the source map does not contain the original source location

			sourceNodeLocation = {
				relativeFilePath: sourceLocation.relativeUrl,
				functionIdentifier
			}
		}

		let {
			relativeNodeModulePath,
			nodeModule
		}: NodeModulePerFilePathCacheResult = {
			relativeNodeModulePath: null,
			nodeModule: null
		}

		if (sourceNodeLocation.relativeFilePath.toString() !== './') {
			// determine the node module of the source node location if there is one
			({ relativeNodeModulePath, nodeModule } =
				this.nodeModuleFromFilePath(sourceNodeLocation.relativeFilePath))

			if (relativeNodeModulePath && nodeModule) {
				// since the source node location is within a node module
				// adjust the relativeFilePath so its relative to that node module directory
				sourceNodeLocation.relativeFilePath = relativeNodeModulePath.pathTo(sourceNodeLocation.relativeFilePath)
			}
		} else {
			sourceNodeLocation.relativeFilePath = new UnifiedPath(
				UNKNOWN_SCRIPTS_FOLDER_NAME
			).join(sourceLocation.scriptID)
			functionIdentifierPresentInOriginalFile = false
		}

		if (
			originalSourceFileNotFoundError !== undefined &&
			(!relativeNodeModulePath || !nodeModule)
		) {
			// The original source file does not exist, only print an error if:
			// - the source file is NOT part of a node module,
			//		since node modules often include source maps that point to non-existing files we ignore them
			if (this.hideOriginalSourceFileNotExistErrors === false) {
				LoggerHelper.error(
					'ResolveFunctionIdentifierHelper.resolveFunctionIdentifier: original source file does not exist', {
						rootDir: this.rootDir.toString(),
						sources: sourceMap?.sources,
						url: sourceLocation.absoluteUrl.toString(),
						scriptID: sourceLocation.scriptID,
						lineNumber,
						columnNumber,
						triedToParse: originalSourceFileNotFoundError
					}
				)
			}
		}

		if (functionIdentifier === '') {
			LoggerHelper.error(
				'ResolveFunctionIdentifierHelper.resolveFunctionIdentifier: functionIdentifier should not be empty', {
				url: sourceLocation.absoluteUrl.toString(),
				scriptID: sourceLocation.scriptID,
				lineNumber,
				columnNumber
			})
			throw new Error(
				'ResolveFunctionIdentifierHelper.resolveFunctionIdentifier: functionIdentifier should not be empty'
			)
		}


		const result = {
			sourceNodeLocation,
			functionIdentifierPresentInOriginalFile,
			relativeNodeModulePath,
			nodeModule
		}
		// cache result
		this.functionIdentifierCache.set(
			sourceLocation.index,
			result
		)

		return result
	}

	/**
	 * Why does this function exists?
	 * 
	 * Example source code:
	 * 1 methodABC(title, highResolutionStopTime) {
	 * 2         var _a, _b, _c;
	 * 3         return __awaiter(this, void 0, void 0, function* () {
	 * 4         		// do something
	 * 5         });
	 * 6 }
	 * 
	 * If a source mapping exists for every line except line 2 and 3
	 * and the function identifier is requested for line 2 or 3 the source map will return undefined.
	 * 
	 * So the ProgramStructureTree node has to be resolved for that location.
	 * This will return the parent function (methodABC) and its corresponding scope for line 2 and 3,
	 * since the ProgramStructureTree treats the __awaiter function as part of the methodABC function.
	 * 
	 * Then the sourcemap can be used to resolve the original source location of the function methodABC.
	 * 
	 * If the sourcemap still returns undefined,
	 * the requested source code location is not part of the original source code.
	 * 
	 */
	static async resolveMappedLocationFromSourceMap(
		programStructureTreeNodeScript: ProgramStructureTree,
		sourceMap: SourceMap,
		lineNumber: number,
		columnNumber: number
	): Promise<NullableMappedPosition | undefined> {
		const originalPosition = await sourceMap.getOriginalSourceLocation(lineNumber, columnNumber)

		// check if position could be resolved
		if (originalPosition && originalPosition.source) {
			return originalPosition
		} else {
			// if position could not be resolved
			// resolve function via ProgramStructureTree and try to resolve the original position again
			const identifierNode = programStructureTreeNodeScript.identifierNodeBySourceLocation(
				{ line: lineNumber, column: columnNumber }
			)
			if (identifierNode === undefined) {
				return undefined
			}
			return sourceMap.getOriginalSourceLocation(
				identifierNode.node.beginLoc.line,
				identifierNode.node.beginLoc.column
			)
		}
	}
}