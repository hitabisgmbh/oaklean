import path from 'path'

import { MappedPosition } from 'source-map'

import { LoggerHelper } from './LoggerHelper'
import { TypescriptParser } from './TypescriptParser'
import { UrlProtocolHelper } from './UrlProtocolHelper'
import { NodeModuleUtils } from './NodeModuleUtils'
import { CPUProfileSourceLocation } from './CPUProfile/CPUProfileSourceLocation'
import { ExternalResourceHelper } from './ExternalResourceHelper'

import { SourceMap } from '../model/SourceMap'
import { NodeModule } from '../model/NodeModule'
import { ProgramStructureTree } from '../model/ProgramStructureTree'
import { UnifiedPath } from '../system/UnifiedPath'
import {
	UnifiedPath_string,
	ResolvedSourceNodeLocation
} from '../types'

export type ResolveFunctionIdentifierResult = {
	sourceNodeLocation: ResolvedSourceNodeLocation,
	functionIdentifierPresentInOriginalFile: boolean,
	nodeModule: NodeModule | null
	relativeNodeModulePath: UnifiedPath | null
}

/**
 * This helper resolves a function identifier from a CPU profile's source location.
 * It does so by requesting the executed code from the Node engine and parsing it.
 * If the requested code contains a source map, it attempts to resolve the original source location.
 * 
 * Additionally, it checks whether the executed code is part of a Node module.
 * If so, it determines the associated Node module.
 */
export class ResolveFunctionIdentifierHelper {
	private rootDir: UnifiedPath
	private externalResourceHelper: ExternalResourceHelper

	// script id -> PST
	private PSTperNodeScript: Map<string, ProgramStructureTree>
	// file path -> PST
	private PSTperOriginalFile: Map<UnifiedPath_string, ProgramStructureTree | null>
	// cpu profile source location id -> cached ResolveFunctionIdentifierResult
	private functionIdentifierCache: Map<number, ResolveFunctionIdentifierResult>
	
	constructor(
		rootDir: UnifiedPath,
		externalResourceHelper: ExternalResourceHelper
	) {
		this.rootDir = rootDir
		this.externalResourceHelper = externalResourceHelper
		this.PSTperNodeScript = new Map()
		this.PSTperOriginalFile = new Map()
		this.functionIdentifierCache = new Map()
	}

	async resolveFunctionIdentifier(
		sourceLocation: CPUProfileSourceLocation
	): Promise<ResolveFunctionIdentifierResult> {
		// check wether the given source location was already resolved by checking the cache
		let functionIdentifierCacheResult = this.functionIdentifierCache.get(sourceLocation.index)
		if (functionIdentifierCacheResult !== undefined) {
			return functionIdentifierCacheResult
		}

		let programStructureTreeNodeScript: ProgramStructureTree | undefined =
			this.PSTperNodeScript.get(sourceLocation.scriptID)
		let programStructureTreeOriginal: ProgramStructureTree | undefined | null = undefined
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
					'InsertCPUProfileHelper.resolveFunctionIdentifier: sourceCode should not be null' +
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
		const originalPosition = sourceMap !== null ? ResolveFunctionIdentifierHelper.
			resolveMappedLocationFromSourceMap(
				programStructureTreeNodeScript,
				sourceMap,
				lineNumber,
				columnNumber
			) : undefined

		if (originalPosition && originalPosition.source) {
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
					) !== undefined
					sourceNodeLocation = {
						relativeFilePath: relativeOriginalSourcePath,
						functionIdentifier: originalFunctionIdentifier
					}
				}
			} else {
				if (urlProtocol === null) {
					originalSourceFileNotFoundError = {
						originalPositionSource: originalPosition.source,
						originalPositionPath,
						absoluteOriginalSourcePath,
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
		// determine the node module of the source node location if there is one
		const {
			relativeNodeModulePath,
			nodeModule
		} = NodeModuleUtils.nodeModuleFromUrl(
			this.externalResourceHelper,
			sourceNodeLocation.relativeFilePath
		)

		if (relativeNodeModulePath && nodeModule) {
			// since the source node location is within a node module
			// adjust the relativeFilePath so its relative to that node module directory
			sourceNodeLocation.relativeFilePath = relativeNodeModulePath.pathTo(sourceNodeLocation.relativeFilePath)
		}

		if (
			originalSourceFileNotFoundError !== undefined &&
			(!relativeNodeModulePath || !nodeModule)
		) {
			// The original source file does not exist, only print an error if:
			// - the source file is NOT part of a node module,
			//		since node modules often include source maps that point to non-existing files we ignore them
			LoggerHelper.error(
				'InsertCPUProfileHelper.resolveFunctionIdentifier: original source file does not exist', {
					rootDir: this.rootDir.toString(),
					sources: sourceMap?.sources,
					url: sourceLocation.absoluteUrl.toString(),
					lineNumber,
					columnNumber,
					...originalSourceFileNotFoundError,
				}
			)
		}

		if (functionIdentifier === '') {
			LoggerHelper.error('InsertCPUProfileHelper.resolveFunctionIdentifier: functionIdentifier should not be empty', {
				url: sourceLocation.absoluteUrl.toString(),
				lineNumber,
				columnNumber
			})
			throw new Error('InsertCPUProfileHelper.resolveFunctionIdentifier: functionIdentifier should not be empty')
		}


		functionIdentifierCacheResult = {
			sourceNodeLocation,
			functionIdentifierPresentInOriginalFile,
			relativeNodeModulePath,
			nodeModule
		}
		// cache result
		this.functionIdentifierCache.set(
			sourceLocation.index,
			functionIdentifierCacheResult
		)

		return functionIdentifierCacheResult
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
	static resolveMappedLocationFromSourceMap(
		programStructureTreeNodeScript: ProgramStructureTree,
		sourceMap: SourceMap,
		lineNumber: number,
		columnNumber: number
	): MappedPosition | undefined {
		const originalPosition = sourceMap.getOriginalSourceLocation(lineNumber, columnNumber)

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