import * as fs from 'fs'

import { SourceMapConsumer, RawSourceMap, MappedPosition } from 'source-map'

import { BaseModel } from './BaseModel'

import { DataUrlUtils } from '../helper/DataUrlUtils'
import { UnifiedPath } from '../system/UnifiedPath'

const SOURCE_MAPPING_URL_REGEX = /^\/\/# sourceMappingURL=(.*)$/m
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
		sources: string[],
		names: string[],
		mappings: string
	) {
		super()
		this.sourceMapLocation = sourceMapLocation
		this.version = version
		this.sources = sources
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
			data.version,
			data.sources,
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
				sources,
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

	static fromCompiledJSString(filePath: UnifiedPath, sourceCode: string): SourceMap | null {
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
			if (fs.existsSync(sourceMapLocation.toString())) {
				const data = fs.readFileSync(sourceMapLocation.toString(), { encoding: 'utf-8' })
				return SourceMap.fromJsonString(data, sourceMapLocation)
			}
		}
		return null
	}

	toBase64String(): string {
		const data: any = {}
		
		for (const attributeName of SOURCE_MAP_ATTRIBUTE_NAMES) {
			data[attributeName] = (this as any)[attributeName]
		}

		return Buffer.from(JSON.stringify(data)).toString('base64')
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

	getOriginalSourceLocation(line: number, column: number): MappedPosition | undefined {
		const originalPosition = this.asConsumer().originalPositionFor(
			{ line, column })

		if (!originalPosition.source) {
			return undefined
		}

		return originalPosition
	}
}