import { SensorValues } from '../../../model/SensorValues'
import { SourceNodeMetaData } from '../../../model/SourceNodeMetaData'
// Types
import {
	ISensorValues,
	SourceNodeID_number,
	SourceNodeMetaDataType
} from '../../../types'

type AccountingType =
	| 'accountToLangInternal'
	| 'accountToIntern'
	| 'accountToExtern'
	| 'accountOwnCodeGetsExecutedByExternal'

export type Compensation = {
	id: number
	// the total sum of all compensations
	total: SensorValues,
	// the individual compensations per source node id
	// used to rollback compensations if needed
	compensationPerNode: Map<SourceNodeID_number, SensorValues>
}

export type AccountingInfo = {
	type: AccountingType
	accountedSourceNode: SourceNodeMetaData<
		SourceNodeMetaDataType.SourceNode |
		SourceNodeMetaDataType.LangInternalSourceNode
	>
	accountedSourceNodeReference: SourceNodeMetaData<
	SourceNodeMetaDataType.LangInternalSourceNodeReference |
	SourceNodeMetaDataType.InternSourceNodeReference |
	SourceNodeMetaDataType.ExternSourceNodeReference
	> | null
	accountedSensorValues: ISensorValues
}