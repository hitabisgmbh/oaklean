import { z as zod } from 'zod'

import {
	IPowerMetricsSensorInterfaceOptions,
	IPowerMetricsSensorInterfaceOptions_schema
} from '../interfaces/powermetrics/types'
import {
	IPerfSensorInterfaceOptions,
	IPerfSensorInterfaceOptions_schema
} from '../interfaces/perf/types'
import {
	IWindowsSensorInterfaceOptions,
	IWindowsSensorInterfaceOptions_schema
} from '../interfaces/windows/types'
import { DeepPartial } from '../shared'

export enum SensorInterfaceType {
	powermetrics = 'powermetrics',
	perf = 'perf',
	windows = 'windows'
}

export const SensorInterfaceOptions_schema = zod.union([
	zod.object({
		type: zod.literal(SensorInterfaceType.powermetrics),
		options: IPowerMetricsSensorInterfaceOptions_schema
	}),
	zod.object({
		type: zod.literal(SensorInterfaceType.perf),
		options: IPerfSensorInterfaceOptions_schema
	}),
	zod.object({
		type: zod.literal(SensorInterfaceType.windows),
		options: IWindowsSensorInterfaceOptions_schema
	})
])

export type SensorInterfaceOptions =
	| {
			type: SensorInterfaceType.powermetrics
			options: IPowerMetricsSensorInterfaceOptions
	  }
	| {
			type: SensorInterfaceType.perf
			options: IPerfSensorInterfaceOptions
	  }
	| {
			type: SensorInterfaceType.windows
			options: IWindowsSensorInterfaceOptions
	  }

export const ExportOptionsSchema = zod.object({
	outDir: zod.string(),
	outHistoryDir: zod.string(),
	rootDir: zod.string(),
	exportV8Profile: zod.boolean(),
	exportReport: zod.boolean(),
	exportSensorInterfaceData: zod.boolean()
})
export type ExportOptions = zod.infer<typeof ExportOptionsSchema>

export const RegistryOptionsSchema = zod.object({
	url: zod.string()
})

export type RegistryOptions = zod.infer<typeof RegistryOptionsSchema>

export const ProjectOptionsSchema = zod.object({
	identifier: zod.string()
})

export type ProjectOptions = zod.infer<typeof ProjectOptionsSchema>

export const RuntimeOptionsSchema = zod.object({
	seeds: zod.object({
		'Math.random': zod.string().optional()
	}),
	sensorInterface: SensorInterfaceOptions_schema.optional(),
	v8: zod.object({
		cpu: zod.object({
			sampleInterval: zod.number()
		})
	})
})

export type RuntimeOptions = zod.infer<typeof RuntimeOptionsSchema>

export const IProfilerConfig_schema = zod.object({
	extends: zod.string().optional(),
	exportOptions: ExportOptionsSchema,
	registryOptions: RegistryOptionsSchema,
	projectOptions: ProjectOptionsSchema,
	runtimeOptions: RuntimeOptionsSchema
})

export type IProfilerConfig = zod.infer<typeof IProfilerConfig_schema>

export interface IProfilerConfigFileRepresentation {
	extends?: string
	exportOptions?: DeepPartial<ExportOptions>
	registryOptions?: DeepPartial<RegistryOptions>
	projectOptions?: DeepPartial<ProjectOptions>
	runtimeOptions?: DeepPartial<RuntimeOptions>
}
