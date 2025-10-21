import { SensorValues } from '../../../model/SensorValues'
import { SourceNodeMetaData } from '../../../model/SourceNodeMetaData'
// Types
import {
	ISensorValues,
	SourceNodeMetaDataType_Node,
	SourceNodeMetaDataType_Reference
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

export type AccountingSourceNodeInfo<T extends SourceNodeMetaDataType_Node> = {
	firstTimeVisited: boolean
	node: SourceNodeMetaData<T>
}

export type AccountingSourceNodeReferenceInfo<
	T extends SourceNodeMetaDataType_Reference
> = {
	firstTimeVisited: boolean
	reference?: SourceNodeMetaData<T>
}

export type AccountingInfo<
	NT extends SourceNodeMetaDataType_Node = SourceNodeMetaDataType_Node,
	RT extends SourceNodeMetaDataType_Reference = SourceNodeMetaDataType_Reference
> = {
	type: AccountingType
	accountedSourceNode: AccountingSourceNodeInfo<NT>
	accountedSourceNodeReference: AccountingSourceNodeReferenceInfo<RT> | null
	accountedSensorValues: ISensorValues
}
