import { ISourceNodeIndex, SourceNodeIndexType } from './SourceNodeIndex'

const PathIDSymbol: unique symbol = Symbol('PathIDSymbol')
export type PathID_number = number & { [PathIDSymbol]: never }

export interface IPathIndex {
	id?: PathID_number
	children?: Record<string, IPathIndex>
	file?: Record<string, ISourceNodeIndex<SourceNodeIndexType>>
	cucc?: boolean // contains uncommitted changes
}