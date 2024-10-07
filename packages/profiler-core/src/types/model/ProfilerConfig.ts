import {
	IPowerMetricsSensorInterfaceOptions,
} from '../interfaces/powermetrics/types'
import {
	IPerfSensorInterfaceOptions,
} from '../interfaces/perf/types'
import {
	IWindowsSensorInterfaceOptions
} from '../interfaces/windows/types'
import {
	ProjectIdentifier_string
} from '../model/ProjectReport'
import {
	MicroSeconds_number
} from '../helper/TimeHelper'

export enum SensorInterfaceType {
	powermetrics = 'powermetrics',
	perf = 'perf',
	windows = 'windows'
}

export type SensorInterfaceOptions = {
	type: SensorInterfaceType.powermetrics,
	options: IPowerMetricsSensorInterfaceOptions
} | {
	type: SensorInterfaceType.perf,
	options: IPerfSensorInterfaceOptions
} | {
	type: SensorInterfaceType.windows,
	options: IWindowsSensorInterfaceOptions
}

export type ProjectOptions = {
	identifier: ProjectIdentifier_string
}

export type RegistryOptions = {
	url: string
}

export type ExportOptions = {
	outDir: string
	outHistoryDir: string,
	rootDir: string
	exportV8Profile: boolean,
	exportReport: boolean,
	exportSensorInterfaceData: boolean
}

export type RuntimeOptions = {
	seeds: {
		'Math.random'?: string
	},
	sensorInterface?: SensorInterfaceOptions,
	v8: {
		cpu: {
			sampleInterval: MicroSeconds_number
		}
	}
}

export interface IProfilerConfig {
	extends?: string
	exportOptions: ExportOptions
	registryOptions: RegistryOptions
	projectOptions: ProjectOptions
	runtimeOptions: RuntimeOptions
}
