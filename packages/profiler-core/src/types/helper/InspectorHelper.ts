import { ScriptID_string } from './CPUNode'

import { UnifiedPath_string } from '../system'
import { INodeModule } from '../model/NodeModule'
import { ISourceMap } from '../../model/SourceMap'

export type IInspectorHelper = {
	sourceCodeMap: Record<ScriptID_string, string>,
	sourceMapMap: Record<ScriptID_string, ISourceMap | null>,
	loadedFiles: Record<UnifiedPath_string, string | null>,
	loadedFilesSourceMapMap: Record<UnifiedPath_string, ISourceMap | null>
	nodeModules: Record<UnifiedPath_string, INodeModule | null>
}