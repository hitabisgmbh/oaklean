import { UnifiedPath_string } from '../system'

export type IInspectorHelper = {
	sourceCodeMap: Record<string, string>,
	loadedFiles: Record<UnifiedPath_string, string>
}