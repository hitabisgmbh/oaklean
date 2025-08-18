import { IPathIndex } from './PathIndex'

import { UnifiedPathPart_string } from '../../system'

const ModuleIDSymbol: unique symbol = Symbol('ModuleIDSymbol')
export type ModuleID_number = number & { [ModuleIDSymbol]: never }

export interface IModuleIndex {
	id: ModuleID_number
	children: Record<UnifiedPathPart_string, IPathIndex>
}