import { ISourceNodeIndex, SourceNodeIndexType } from './SourceNodeIndex'

import { UnifiedPathPart_string } from '../../system/UnifiedPath'
import { SourceNodeIdentifierPart_string } from '../../SourceNodeIdentifiers'

const PathIDSymbol: unique symbol = Symbol('PathIDSymbol')
export type PathID_number = number & { [PathIDSymbol]: never }

export interface IPathIndex {
	id?: PathID_number
	children?: Record<UnifiedPathPart_string, IPathIndex>
	file?: Record<SourceNodeIdentifierPart_string, ISourceNodeIndex<SourceNodeIndexType>>
	cucc?: boolean // contains uncommitted changes
}
