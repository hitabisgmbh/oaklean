
import {
	MilliJoule_number
} from '../interfaces/BaseMetricsData'
import {
	PrimitiveBufferTypes
} from '../helper/BufferHelper'

export interface IPureCPUEnergyConsumption {
	selfCPUEnergyConsumption?: MilliJoule_number,
	aggregatedCPUEnergyConsumption?: MilliJoule_number
}

export interface IPureRAMEnergyConsumption {
	selfRAMEnergyConsumption?: MilliJoule_number,
	aggregatedRAMEnergyConsumption?: MilliJoule_number
}

export interface IPureCPUTime {
	selfCPUTime?: number,
	aggregatedCPUTime?: number
}

export interface ISensorValues extends IPureCPUTime, IPureCPUEnergyConsumption, IPureRAMEnergyConsumption {
	profilerHits?: number

	internCPUTime?: number
	externCPUTime?: number
	langInternalCPUTime?: number

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