import { ISourceMap } from '../../model/SourceMap'

export type IInspectorHelper = {
	sourceCodeMap: Record<string, string>
	sourceMapMap: Record<string, ISourceMap | null>
}