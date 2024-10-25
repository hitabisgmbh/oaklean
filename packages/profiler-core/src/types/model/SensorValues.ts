
import {
	MilliJoule_number
} from '../interfaces/BaseMetricsData'
import {
	PrimitiveBufferTypes
} from '../helper/BufferHelper'
import { MicroSeconds_number } from '../helper'

export interface IPureCPUEnergyConsumption {
	selfCPUEnergyConsumption?: MilliJoule_number,
	aggregatedCPUEnergyConsumption?: MilliJoule_number
}

export interface IPureRAMEnergyConsumption {
	selfRAMEnergyConsumption?: MilliJoule_number,
	aggregatedRAMEnergyConsumption?: MilliJoule_number
}

export interface IPureCPUTime {
	selfCPUTime?: MicroSeconds_number,
	aggregatedCPUTime?: MicroSeconds_number
}

export interface ISensorValues extends IPureCPUTime, IPureCPUEnergyConsumption, IPureRAMEnergyConsumption {
	profilerHits?: number

	internCPUTime?: MicroSeconds_number
	externCPUTime?: MicroSeconds_number
	langInternalCPUTime?: MicroSeconds_number

	internCPUEnergyConsumption?: MilliJoule_number
	externCPUEnergyConsumption?: MilliJoule_number
	langInternalCPUEnergyConsumption?: MilliJoule_number

	internRAMEnergyConsumption?: MilliJoule_number
	externRAMEnergyConsumption?: MilliJoule_number
	langInternalRAMEnergyConsumption?: MilliJoule_number
}

export type SensorValueToDataTypeMap = {
	[key in keyof ISensorValues]: PrimitiveBufferTypes
};