export interface ISourceMap {
	version: number
	file?: string // optional, name of the generated file (e.g., bundle.js)
	sourceRoot?: string // optional, base path for sources
	sources: (string | null)[] // list of source files (relative or absolute paths)
	sourcesContent?: (string | null)[] // optional, content of the sources (same order as `sources`)
	names?: string[] // optional, list of symbol names
	mappings: string // VLQ-encoded string of mappings
	ignoreList?: number[] // optional, list of indices of files that should be considered third party code
}

// required for the source map to be valid
export const SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES = ['version', 'sources', 'mappings'] as const

export const SOURCE_MAP_ALL_ATTRIBUTE_NAMES = [
	'version',
	'file',
	'sourceRoot',
	'sources',
	'sourcesContent',
	'names',
	'mappings',
	'ignoreList'
] as const
