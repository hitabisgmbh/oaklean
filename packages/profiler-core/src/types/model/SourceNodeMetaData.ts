import { SourceNodeID_number } from './index/SourceNodeIndex'
import { ISensorValues} from './SensorValues'

export enum SourceNodeMetaDataType {
	SourceNode = 0,
	LangInternalSourceNode = 1,
	LangInternalSourceNodeReference = 2,
	InternSourceNodeReference = 3,
	ExternSourceNodeReference = 4,
	Aggregate = 5,
}


export interface ISourceNodeMetaData<T extends SourceNodeMetaDataType> {
	id: T extends SourceNodeMetaDataType.Aggregate ? undefined : SourceNodeID_number
	type: T
	sensorValues: ISensorValues
	lang_internal?: Record<SourceNodeID_number,
	ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>
	intern?: Record<SourceNodeID_number, ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>
	extern?: Record<SourceNodeID_number, ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>>
}