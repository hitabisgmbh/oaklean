// Types
import {
	ProjectIdentifier_string,
	MicroSeconds_number,
	IProfilerConfig
} from '../types'

export const STATIC_CONFIG_FILENAME = '.oaklean'
export const STATIC_LOCAL_CONFIG_FILENAME = '.oaklean.local'
export const STATIC_GLOBAL_CONFIG_DIR = '.oaklean'

export const DEFAULT_PROFILER_CONFIG: IProfilerConfig = {
	extends: STATIC_LOCAL_CONFIG_FILENAME,
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
