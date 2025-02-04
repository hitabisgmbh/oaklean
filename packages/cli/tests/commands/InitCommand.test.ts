import {
	SensorInterfaceType,
	ProjectIdentifier_string,
	ProfilerConfig,
	UnifiedPath,
	MicroSeconds_number,
	DEFAULT_PROFILER_CONFIG,
	Crypto,
	RegistryOptions,
	IProfilerConfig,
	LoggerHelper
} from '@oaklean/profiler-core'

import InitCommands from '../../src/commands/InitCommands'

const DEMO_PROJECT_ID = '7cc8cf7f-3cc9-49f8-8f06-3c3929aa004d' as ProjectIdentifier_string

const GENERATED_NONE_CONFIG_JSON = {
	...DEFAULT_PROFILER_CONFIG,
	projectOptions: {
		...DEFAULT_PROFILER_CONFIG.projectOptions,
		identifier: DEMO_PROJECT_ID
	},
	runtimeOptions: {
		...DEFAULT_PROFILER_CONFIG.runtimeOptions,
		sensorInterface: undefined
	},
	registryOptions: undefined as unknown as RegistryOptions
} satisfies IProfilerConfig

const GENERATED_PERF_CONFIG_JSON = {
	...DEFAULT_PROFILER_CONFIG,
	projectOptions: {
		...DEFAULT_PROFILER_CONFIG.projectOptions,
		identifier: DEMO_PROJECT_ID
	},
	runtimeOptions: {
		...DEFAULT_PROFILER_CONFIG.runtimeOptions,
		sensorInterface: {
			type: SensorInterfaceType.perf,
			options: {
				outputFilePath: 'energy-measurements.txt',
				sampleInterval: 100 as MicroSeconds_number
			}
		}
	},
	registryOptions: undefined as unknown as RegistryOptions
} satisfies IProfilerConfig

const GENERATED_POWERMETRICS_CONFIG_JSON = {
	...DEFAULT_PROFILER_CONFIG,
	projectOptions: {
		...DEFAULT_PROFILER_CONFIG.projectOptions,
		identifier: DEMO_PROJECT_ID
	},
	runtimeOptions: {
		...DEFAULT_PROFILER_CONFIG.runtimeOptions,
		sensorInterface: {
			type: SensorInterfaceType.powermetrics,
			options: {
				outputFilePath: 'energy-measurements.plist',
				sampleInterval: 100 as MicroSeconds_number
			}
		}
	},
	registryOptions: undefined as unknown as RegistryOptions
} satisfies IProfilerConfig

describe('InitCommands', () => {
	const initCommands = InitCommands.init()

	describe('initCommand', () => {
		describe('generates correct config', () => {
			let selectSensorInterface_spy: jest.SpyInstance
			let uniqueID_spy: jest.SpyInstance

			beforeEach(() => {
				selectSensorInterface_spy = jest.spyOn(initCommands, 'selectSensorInterface')
				uniqueID_spy = jest.spyOn(Crypto, 'uniqueID')
				uniqueID_spy.mockReturnValue(DEMO_PROJECT_ID)
			})

			afterEach(() => {
				selectSensorInterface_spy.mockRestore()
				uniqueID_spy.mockRestore()
			})

			test('with none', async () => {
				selectSensorInterface_spy.mockResolvedValue(undefined)

				const config = await initCommands.configureConfig()

				expect(config.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(config.toJSON()).toEqual(GENERATED_NONE_CONFIG_JSON)
			})

			test('with perf', async () => {
				selectSensorInterface_spy.mockResolvedValue(SensorInterfaceType.perf)

				const config = await initCommands.configureConfig()

				expect(config.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(config.toJSON()).toEqual(GENERATED_PERF_CONFIG_JSON)
			})

			test('with powermetrics', async () => {
				selectSensorInterface_spy.mockResolvedValue(SensorInterfaceType.powermetrics)

				const config = await initCommands.configureConfig()

				expect(config.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(config.toJSON()).toEqual(GENERATED_POWERMETRICS_CONFIG_JSON)
			})
		})

		describe('confirmConfigFileContent', () => {
			let confirmConfigFileContent_spy: jest.SpyInstance
			let configStoreToFile_spy: jest.SpyInstance
			let configureConfig_spy: jest.SpyInstance
			let consoleLog_spy: jest.SpyInstance

			beforeEach(() => {
				confirmConfigFileContent_spy = jest.spyOn(initCommands, 'confirmConfigFileContent')
				configStoreToFile_spy = jest.spyOn(ProfilerConfig.prototype, 'storeToFile')
				configStoreToFile_spy.mockImplementation(() => undefined)
				configureConfig_spy = jest.spyOn(initCommands, 'configureConfig')
				consoleLog_spy = jest.spyOn(LoggerHelper, 'log')
				consoleLog_spy.mockImplementation(() => undefined)
			})

			afterEach(() => {
				confirmConfigFileContent_spy.mockRestore()
				configStoreToFile_spy.mockRestore()
			})

			test('returns true with perf', async () => {
				const demoConfig = ProfilerConfig.fromJSON(GENERATED_PERF_CONFIG_JSON)
				configureConfig_spy.mockResolvedValue(demoConfig)
				confirmConfigFileContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(demoConfig, null, 2))
				expect(consoleLog_spy).toHaveBeenCalledWith('perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md')
				expect(configStoreToFile_spy).toHaveBeenCalledWith(demoConfig.filePath)
			})

			test('returns true with powermetrics', async () => {
				const demoConfig = ProfilerConfig.fromJSON(GENERATED_POWERMETRICS_CONFIG_JSON)
				configureConfig_spy.mockResolvedValue(demoConfig)
				confirmConfigFileContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(demoConfig, null, 2))
				expect(configStoreToFile_spy).toHaveBeenCalledWith(demoConfig.filePath)
			})

			test('returns true with none', async () => {
				const demoConfig = ProfilerConfig.fromJSON(GENERATED_NONE_CONFIG_JSON)
				configureConfig_spy.mockResolvedValue(demoConfig)
				confirmConfigFileContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(demoConfig, null, 2))
				expect(configStoreToFile_spy).toHaveBeenCalledWith(demoConfig.filePath)
			})

			test('returns false', async () => {
				const demoConfig = ProfilerConfig.fromJSON(GENERATED_NONE_CONFIG_JSON)
				configureConfig_spy.mockResolvedValue(demoConfig)
				confirmConfigFileContent_spy.mockResolvedValue(false)

				await initCommands.initCommand()

				expect(consoleLog_spy).not.toHaveBeenCalledWith()
				expect(configStoreToFile_spy).not.toHaveBeenCalled()
			})
		})

	})
})