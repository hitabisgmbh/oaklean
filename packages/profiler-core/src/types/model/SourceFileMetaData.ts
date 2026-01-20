import { ISourceNodeMetaData, SourceNodeMetaDataType } from './SourceNodeMetaData'
import { SourceNodeID_number } from './indices/SourceNodeIndex'

import { UnifiedPath_string } from '../system/UnifiedPath'
import { LangInternalPath_string } from '../SourceNodeIdentifiers'

export interface ISourceFileMetaData {
	path: UnifiedPath_string | LangInternalPath_string
	functions?: Record<
		SourceNodeID_number,
		ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>
	>
}

export interface IAggregatedSourceNodeMetaData {
	total: ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
	max: ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
}
