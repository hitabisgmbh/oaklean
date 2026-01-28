import { IModuleIndex } from './ModuleIndex'

import { NodeModuleIdentifier_string } from '../NodeModule'

export interface IGlobalIndex {
	currentId: number
	moduleMap: Record<NodeModuleIdentifier_string, IModuleIndex>
}

export type IndexRequestType = 'get' | 'upsert'

export type GlobalIndexType = 'module' | 'path' | 'sourceNode'
