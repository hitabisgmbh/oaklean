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
	// compensation that was just created
	createdComp: null | SensorValues
	// total compensation (carried from previous compensations | does not include createdComp)
	carriedComp: SensorValues
}

export type AccountingInfo = {
	type: AccountingType
	accountedSourceNode: {
		firstTimeVisited: boolean,
		node: SourceNodeMetaData<
			| SourceNodeMetaDataType.SourceNode
			| SourceNodeMetaDataType.LangInternalSourceNode
		>
	}
	accountedSourceNodeReference: {
		firstTimeVisited: boolean
		reference: SourceNodeMetaData<
			| SourceNodeMetaDataType.LangInternalSourceNodeReference
			| SourceNodeMetaDataType.InternSourceNodeReference
			| SourceNodeMetaDataType.ExternSourceNodeReference
		>
	} | null
	accountedSensorValues: ISensorValues
}
