import {
	NanoSeconds_BigInt
} from '../helper/TimeHelper'
import {
	MilliJoule_number
} from '../interfaces/BaseMetricsData'

export interface ILibreHardwareMonitorMetricsDataOutputFormat {
	elapsed_ns: NanoSeconds_BigInt,
	timestamp: NanoSeconds_BigInt, // marks the start time of the sample
	cpu_energy: MilliJoule_number,
	ram_energy: MilliJoule_number,
	gpu_energy: MilliJoule_number
}

export interface ILibreHardwareMonitorMetricsData {
	data: {
		elapsed_ns: string,
		timestamp: string, // marks the start time of the sample
		cpu_energy: MilliJoule_number,
		ram_energy: MilliJoule_number,
		gpu_energy: MilliJoule_number
	}
}