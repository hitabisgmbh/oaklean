import {
	MilliJoule_number
} from './BaseMetricsData'

import {
	NanoSeconds_BigInt
} from '../helper/TimeHelper'


export interface IWindowsSensorInterfaceMetricsDataOutputFormat {
	elapsed_ns: NanoSeconds_BigInt,
	timestamp: NanoSeconds_BigInt, // marks the start time of the sample
	cpu_energy: MilliJoule_number,
	ram_energy: MilliJoule_number,
	gpu_energy: MilliJoule_number
}

export interface IWindowsSensorInterfaceMetricsData {
	data: {
		elapsed_ns: string,
		timestamp: string, // marks the start time of the sample
		cpu_energy: MilliJoule_number,
		ram_energy: MilliJoule_number,
		gpu_energy: MilliJoule_number
	}
}