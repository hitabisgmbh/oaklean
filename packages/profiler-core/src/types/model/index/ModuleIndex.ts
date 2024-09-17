import { IPathIndex } from './PathIndex'

const ModuleIDSymbol: unique symbol = Symbol('ModuleIDSymbol')
export type ModuleID_number = number & { [ModuleIDSymbol]: never }

export interface IModuleIndex {
	id: ModuleID_number
	children: Record<string, IPathIndex>
}