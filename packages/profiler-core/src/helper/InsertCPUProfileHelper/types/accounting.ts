import { SensorValues } from '../../../model/SensorValues'
import { SourceNodeMetaData } from '../../../model/SourceNodeMetaData'
// Types
import {
	ISensorValues,
	SourceNodeMetaDataType
} from '../../../types'

type AccountingType =
	| 'accountToLangInternal'
	| 'accountToIntern'
	| 'accountToExtern'
	| 'accountOwnCodeGetsExecutedByExternal'

export type Compensation = {
	id: number
	sensorValues: SensorValues
}

export type AccountingInfo = {
	type: AccountingType
	accountedSourceNodeReference: SourceNodeMetaData<
	SourceNodeMetaDataType.LangInternalSourceNodeReference |
	SourceNodeMetaDataType.InternSourceNodeReference |
	SourceNodeMetaDataType.ExternSourceNodeReference
	> | null
	accountedProfilerHits: number
	accountedSensorValues: ISensorValues
}