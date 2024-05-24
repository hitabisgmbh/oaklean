import { ProjectIdentifier_string } from '../model/ProjectReport'
import { IProfilerConfig } from '../model/ProfilerConfig'
import { MicroSeconds_number } from '../helper/TimeHelper'

export const STATIC_CONFIG_FILENAME = '.oaklean'

export const DEFAULT_PROFILER_CONFIG: IProfilerConfig = {
	exportOptions: {
		outDir: 'profiles/',
		outHistoryDir: 'profiles_history/',
		rootDir: './',
		exportV8Profile: false,
		exportReport: true,
		exportSensorInterfaceData: false
	},
	projectOptions: {
		identifier: '00000000-0000-0000-0000-000000000000' as ProjectIdentifier_string
	},
	runtimeOptions: {
		seeds: {},
		v8: {
			cpu: {
				sampleInterval: 1 as MicroSeconds_number
			}
		}
	},
	registryOptions: {
		url: 'oaklean.io/project-report'
	}
}
