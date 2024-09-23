import {
	IPowerMetricsData
} from './PowerMetricsData'
import {
	IPerfMetricsData
} from './PerfMetricsData'
import {
	ILibreHardwareMonitorMetricsData
} from './LibreHardwareMonitorMetricsData'

import {
	NanoSeconds_BigInt
} from '../helper/TimeHelper'

export enum MetricsDataCollectionType {
	PowerMetricsPerProcess = 'PowerMetricsPerProcess',
	PerfTotalSystem = 'PerfTotalSystem'
}

export type TimeInfo = {
	startTime: NanoSeconds_BigInt,
	stopTime: NanoSeconds_BigInt
}

export type ITimeInfo = {
	startTime: string,
	stopTime: string
}

export interface IMetricsDataCollection {
	type: MetricsDataCollectionType,
	pid: number,
	items: (IPowerMetricsData | IPerfMetricsData | ILibreHardwareMonitorMetricsData)[]
	timeInfo: ITimeInfo
}