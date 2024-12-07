import * as fs from 'fs'

import { SourceMapConsumer, RawSourceMap, MappedPosition } from 'source-map'

import { BaseModel } from './BaseModel'

import { DataUrlUtils } from '../helper/DataUrlUtils'
import { UnifiedPath } from '../system/UnifiedPath'

const SOURCE_MAPPING_URL_REGEX = /\/\/# sourceMappingURL=(.*)$/m
const SOURCE_MAP_ATTRIBUTE_NAMES = ['version', 'sources', 'names', 'mappings']

export interface ISourceMap {
	version: number
	sources: string[]
	names: string[]
	mappings: string
}

export class SourceMap extends BaseModel implements ISourceMap {
	private _consumer: SourceMapConsumer | undefined
	private _numberOfLinesInCompiledFile: number | undefined

	sourceMapLocation: UnifiedPath // location of the source map, for inline sourceMaps it is the .js file

	version: number
	sources: string[]
	names: string[]
	mappings: string

	constructor(
		sourceMapLocation: UnifiedPath,
		version: number,
		sources: UnifiedPath[],
		names: string[],
		mappings: string
	) {
		super()
		this.sourceMapLocation = sourceMapLocation
		this.version = version
		this.sources = sources.map((x) => x.toString())
		this.names = names
		this.mappings = mappings
	}

	public get numberOfLinesInCompiledFile() : number {
		if (this._numberOfLinesInCompiledFile === undefined) {
			let maxLine = 0
			this.asConsumer().eachMapping((mapping) => {
				if (mapping.generatedLine > maxLine) {
					maxLine = mapping.generatedLine
				}
			})
			this._numberOfLinesInCompiledFile = maxLine
		}
		return this._numberOfLinesInCompiledFile
	}
	

	toJSON(): ISourceMap {
		return {
			version: this.version,
			sources: this.sources,
			names: this.names,
			mappings: this.mappings
		}
	}

	static fromJSON(json: string | ISourceMap): SourceMap {
		let data: ISourceMap
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		return new SourceMap(
			new UnifiedPath(''),
			data.version,
			data.sources.map((x) => new UnifiedPath(x as unknown as string)),
			data.names,
			data.mappings
		)
	}

	static fromJsonString(
		s: string,
		sourceMapLocation: UnifiedPath
	): SourceMap | null {
		const parsed = JSON.parse(s)

		if (SourceMap.isSourceMap(parsed)) {
			const { version, sources, names, mappings } = parsed
			return new SourceMap(
				sourceMapLocation,
				version,
				sources.map((sourcePath: string) => new UnifiedPath(sourcePath)),
				names,
				mappings
			)
		}
		return null
	}

	static isSourceMap(sourceMapCandidate: object | null): boolean {
		if (!sourceMapCandidate) {
			return false
		}
		for (const attributeName of SOURCE_MAP_ATTRIBUTE_NAMES) {
			if (!(attributeName in sourceMapCandidate)) {
				return false
			}
		}
		return true
	}

	static fromCompiledJSString(filePath: UnifiedPath, sourceCode: string): SourceMap | null {
		const match = SOURCE_MAPPING_URL_REGEX.exec(sourceCode)

		if (match) {
			const sourceMapUrl = match[1]

			if (DataUrlUtils.isDataUrl(sourceMapUrl)) {
				// inline source map
				const data = DataUrlUtils.parseDataUrl(sourceMapUrl)
				return SourceMap.fromJsonString(data, filePath)
			} else {
				// source map file
				const directoryPath = filePath.dirName()
				const sourceMapLocation = directoryPath.join(sourceMapUrl)
				if (fs.existsSync(sourceMapLocation.toString())) {
					const data = fs.readFileSync(sourceMapLocation.toString(), { encoding: 'utf-8' })
					return SourceMap.fromJsonString(data, sourceMapLocation)
				}
			}
		}
		return null
	}

	static fromCompiledJSFile (filePath: UnifiedPath): SourceMap | null {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return null
		}

		const sourceCode = fs.readFileSync(filePath.toPlatformString(), { encoding: 'utf-8' })
		return SourceMap.fromCompiledJSString(filePath, sourceCode)
	}

	asConsumer(): SourceMapConsumer {
		if (!this._consumer) {
			this._consumer = new SourceMapConsumer(this as unknown as RawSourceMap)
		}
		return this._consumer
	}

	getOriginalSourceLocation(lineNumber: number, columnNumber: number): MappedPosition | undefined {
		// sourcemap expects 1-based line and column
		const line = lineNumber + 1
		const column = columnNumber + 1
		
		let originalPosition = this.asConsumer().originalPositionFor(
			{ line, column })

		// if the source is not properly set we need to skip the lines without a mapping
		// (e.g. "use strict" at the beginning of a file)
		let offset = 1
		while (!originalPosition.source && line + offset < this.numberOfLinesInCompiledFile + 1) {
			originalPosition = this.asConsumer().originalPositionFor(
				{ line: line + offset++, column: column })
		}
		return originalPosition
	}
}