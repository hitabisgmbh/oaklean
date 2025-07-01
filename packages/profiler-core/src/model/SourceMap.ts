import { SourceMapConsumer, RawSourceMap, MappedPosition } from 'source-map'

import { BaseModel } from './BaseModel'

import { DataUrlUtils } from '../helper/DataUrlUtils'
import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	ISourceMap,
	SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES
} from '../types/model/SourceMap'


const SOURCE_MAPPING_URL_REGEX = /^\/\/# sourceMappingURL=(.*)$/m

export type SourceMapRedirect = {
	type: 'redirect',
	sourceMapLocation: UnifiedPath
}
export class SourceMap extends BaseModel implements ISourceMap {
	private _consumer: SourceMapConsumer | undefined
	private _numberOfLinesInCompiledFile: number | undefined

	sourceMapLocation: UnifiedPath // location of the source map, for inline sourceMaps it is the .js file

	version: number
	file?: string // optional, name of the generated file (e.g., bundle.js)
	sourceRoot?: string // optional, base path for sources
	sources: (string | null)[] // list of source files (relative or absolute paths)
	sourcesContent?: (string | null)[] // optional, content of the sources (same order as `sources`)
	names?: string[] // optional, list of symbol names
	mappings: string // VLQ-encoded string of mappings
	ignoreList?: number[]

	constructor(
		sourceMapLocation: UnifiedPath,
		{
			version,
			file,
			sourceRoot,
			sources,
			sourcesContent,
			names,
			mappings,
			ignoreList
		}: ISourceMap
	) {
		super()
		this.sourceMapLocation = sourceMapLocation
		this.version = version
		this.file = file
		this.sourceRoot = sourceRoot
		this.sources = sources
		this.sourcesContent = sourcesContent
		this.names = names
		this.mappings = mappings
		this.ignoreList = ignoreList
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
	
	copy(): SourceMap {
		return SourceMap.fromJSON(this.toJSON())
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
			data
		)
	}

	static fromJsonString(
		s: string,
		sourceMapLocation: UnifiedPath
	): SourceMap | null {
		const parsed = JSON.parse(s)

		if (SourceMap.isSourceMap(parsed)) {
			return new SourceMap(
				sourceMapLocation,
				parsed
			)
		}
		return null
	}

	static isSourceMap(sourceMapCandidate: object | null): boolean {
		if (!sourceMapCandidate) {
			return false
		}
		for (const attributeName of SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES) {
			if (!(attributeName in sourceMapCandidate)) {
				return false
			}
		}
		return true
	}

	static base64StringCompiledJSString(sourceCode: string): {
		base64: string | null | undefined,
		sourceMapUrl: string
	} | null {
		const match = SOURCE_MAPPING_URL_REGEX.exec(sourceCode)

		if (match) {
			const sourceMapUrl = match[1]

			if (DataUrlUtils.isDataUrl(sourceMapUrl)) {
				return {
					base64: DataUrlUtils.base64StringFromDataUrl(sourceMapUrl),
					sourceMapUrl
				}
			}
			return {
				base64: undefined,
				sourceMapUrl
			}
		}
		return null
	}

	static fromCompiledJSString(
		filePath: UnifiedPath,
		sourceCode: string
	): SourceMap | null | SourceMapRedirect{
		const result = SourceMap.base64StringCompiledJSString(sourceCode)

		if (result === null) {
			return null
		}

		if (result.base64 !== undefined) {
			const jsonString = result.base64 !== null ?
				Buffer.from(result.base64, 'base64').toString('utf-8') :
				'{}'
			return SourceMap.fromJsonString(jsonString, filePath)
		} else {
			// source map file
			const directoryPath = filePath.dirName()
			const sourceMapLocation = directoryPath.join(result.sourceMapUrl)
			return {
				type: 'redirect',
				sourceMapLocation
			}
		}
	}

	toBase64String(): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data: any = {}
		
		for (const attributeName of SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			data[attributeName] = (this as any)[attributeName]
		}

		return Buffer.from(JSON.stringify(data)).toString('base64')
	}

	asConsumer(): SourceMapConsumer {
		if (!this._consumer) {
			this._consumer = new SourceMapConsumer({
				version: this.version.toString(),
				file: this.file,
				sourceRoot: this.sourceRoot,
				sources: this.sources,
				sourcesContent: this.sourcesContent,
				names: this.names || [],
				mappings: this.mappings
			} as RawSourceMap)
		}
		return this._consumer
	}

	getOriginalSourceLocation(line: number, column: number): MappedPosition | undefined {
		const originalPosition = this.asConsumer().originalPositionFor(
			{ line, column })

		if (!originalPosition.source) {
			return undefined
		}

		return originalPosition
	}
}