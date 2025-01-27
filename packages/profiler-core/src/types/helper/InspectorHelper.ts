import { UnifiedPath_string } from '../system'
import { INodeModule } from '../model/NodeModule'
import { ISourceMap } from '../../model/SourceMap'

export type IInspectorHelper = {
	sourceCodeMap: Record<string, string>,
	sourceMapMap: Record<UnifiedPath_string, ISourceMap | null>,
	loadedFiles: Record<UnifiedPath_string, string | null>,
	nodeModules: Record<UnifiedPath_string, INodeModule | null>
}