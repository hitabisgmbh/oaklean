import { ScriptID_string } from './CPUNode'

import { UnifiedPath_string } from '../system'
import { INodeModule } from '../model/NodeModule'

export type IExternalResourceFileInfo = {
	sourceCode: string,
	cucc?: boolean // contains uncommitted changes
}

export type IExternalResourceHelper = {
	fileInfoPerScriptID: Record<ScriptID_string, IExternalResourceFileInfo | null>,
	fileInfoPerPath: Record<UnifiedPath_string, IExternalResourceFileInfo | null>,
	nodeModules: Record<UnifiedPath_string, INodeModule | null>
}