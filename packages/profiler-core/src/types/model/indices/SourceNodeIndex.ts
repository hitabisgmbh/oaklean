import { SourceNodeIdentifierPart_string } from '../../SourceNodeIdentifiers'

const SourceNodeIDSymbol: unique symbol = Symbol('SourceNodeIDSymbol')
export type SourceNodeID_number = number & { [SourceNodeIDSymbol]: never }

export enum SourceNodeIndexType {
	Intermediate = 0,
	SourceNode = 1
}

export type SourceNodeIndexID<T> = T extends SourceNodeIndexType.SourceNode ? SourceNodeID_number : undefined

export interface ISourceNodeIndex<T extends SourceNodeIndexType = SourceNodeIndexType.Intermediate> {
	id: SourceNodeIndexID<T>
	children?: Record<SourceNodeIdentifierPart_string, ISourceNodeIndex<SourceNodeIndexType>>
	npiosc?: boolean // not present in original source code
}
