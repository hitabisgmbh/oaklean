import { ProgramStructureTree } from '../../model/ProgramStructureTree'
import { UnifiedPath } from '../../system/UnifiedPath'
// Types
import {
	UnifiedPath_string,
} from '../../types'


export type TraverseNodeInfo = {
	filePath: UnifiedPath | UnifiedPath_string
	idCounter: number
	tree: ProgramStructureTree,
	anonymousScopeCounter: number
	anonymousFunctionCounter: number
	expressionFunctionCounter: number
	literalFunctionCounter: number
}