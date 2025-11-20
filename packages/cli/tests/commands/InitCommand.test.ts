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

				const {
					mainConfig,
					localConfig
				} = await initCommands.configureConfig()

				expect(mainConfig.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(mainConfig.toJSON()).toEqual({
					...GENERATED_NONE_CONFIG_JSON,
					runtimeOptions: {
						...GENERATED_NONE_CONFIG_JSON.runtimeOptions,
						sensorInterface: undefined
					}
				})

				expect(localConfig).toEqual({
					runtimeOptions: {
						sensorInterface: GENERATED_NONE_CONFIG_JSON.runtimeOptions.sensorInterface
					}
				})
			})

			test('with perf', async () => {
				selectSensorInterface_spy.mockResolvedValue(SensorInterfaceType.perf)

				const {
					mainConfig,
					localConfig
				} = await initCommands.configureConfig()

				expect(mainConfig.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(mainConfig.toJSON()).toEqual({
					...GENERATED_PERF_CONFIG_JSON,
					runtimeOptions: {
						...GENERATED_PERF_CONFIG_JSON.runtimeOptions,
						sensorInterface: undefined
					}
				})

				expect(localConfig).toEqual({
					runtimeOptions: {
						sensorInterface: GENERATED_PERF_CONFIG_JSON.runtimeOptions.sensorInterface
					}
				})
			})

			test('with powermetrics', async () => {
				selectSensorInterface_spy.mockResolvedValue(SensorInterfaceType.powermetrics)

				const {
					mainConfig,
					localConfig
				} = await initCommands.configureConfig()

				expect(mainConfig.filePath.toString()).toBe(new UnifiedPath(process.cwd()).join('.oaklean').toString())

				expect(mainConfig.toJSON()).toEqual({
					...GENERATED_POWERMETRICS_CONFIG_JSON,
					runtimeOptions: {
						...GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions,
						sensorInterface: undefined
					}
				})

				expect(localConfig).toEqual({
					runtimeOptions: {
						sensorInterface: GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions.sensorInterface
					}
				})
			})
		})

		describe('confirmConfigFileContent + confirmOverwriteContent_spy', () => {
			let confirmConfigFileContent_spy: jest.SpyInstance
			let confirmOverwriteContent_spy: jest.SpyInstance
			let configAlreadyExists_spy: jest.SpyInstance
			let configStoreToFile_spy: jest.SpyInstance
			let intermediateConfigStoreToFile_spy: jest.SpyInstance
			let configureConfig_spy: jest.SpyInstance
			let consoleLog_spy: jest.SpyInstance
			let consoleSuccessLog_spy: jest.SpyInstance
			let consoleWarnLog_spy: jest.SpyInstance

			beforeEach(() => {
				confirmConfigFileContent_spy = jest.spyOn(initCommands, 'confirmConfigFileContent')
				confirmOverwriteContent_spy = jest.spyOn(initCommands, 'confirmOverwriteContent')
				configAlreadyExists_spy = jest.spyOn(initCommands, 'configAlreadyExists')
				configStoreToFile_spy = jest.spyOn(ProfilerConfig.prototype, 'storeToFile')
				configStoreToFile_spy.mockImplementation(() => undefined)
				intermediateConfigStoreToFile_spy = jest.spyOn(ProfilerConfig, 'storeIntermediateToFile')
				intermediateConfigStoreToFile_spy.mockImplementation(() => undefined)
				configureConfig_spy = jest.spyOn(initCommands, 'configureConfig')
				consoleLog_spy = jest.spyOn(LoggerHelper, 'log')
				consoleLog_spy.mockImplementation(() => undefined)
				consoleSuccessLog_spy = jest.spyOn(LoggerHelper.appPrefix, 'success')
				consoleSuccessLog_spy.mockImplementation(() => undefined)
				consoleWarnLog_spy = jest.spyOn(LoggerHelper.appPrefix, 'warn')
				consoleWarnLog_spy.mockImplementation(() => undefined)
			})

			afterEach(() => {
				confirmConfigFileContent_spy.mockRestore()
				confirmOverwriteContent_spy.mockRestore()
				configStoreToFile_spy.mockRestore()
				intermediateConfigStoreToFile_spy.mockRestore()
				configAlreadyExists_spy.mockRestore()
			})

			test('returns true with perf', async () => {
				const mainConfig = new ProfilerConfig(
					new UnifiedPath(process.cwd()).join('.oaklean'),
					ProfilerConfig.intermediateFromJSON(GENERATED_PERF_CONFIG_JSON) as IProfilerConfig
				)
				const localConfig = {
					runtimeOptions: GENERATED_PERF_CONFIG_JSON.runtimeOptions
				}
				configureConfig_spy.mockResolvedValue({
					mainConfig: mainConfig,
					localConfig: localConfig
				})
				confirmConfigFileContent_spy.mockResolvedValue(true)
				confirmOverwriteContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Main Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(mainConfig, null, 2))
				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Local Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(localConfig, null, 2))
				expect(consoleLog_spy).toHaveBeenCalledWith('[Oaklean] perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md')
				expect(configStoreToFile_spy).toHaveBeenCalledWith(mainConfig.filePath)
				expect(intermediateConfigStoreToFile_spy).toHaveBeenCalledWith(
					new UnifiedPath(process.cwd()).join('.oaklean.local'),
					localConfig
				)
			})

			test('returns true with powermetrics', async () => {
				const mainConfig = new ProfilerConfig(
					new UnifiedPath(process.cwd()).join('.oaklean'),
					ProfilerConfig.intermediateFromJSON(GENERATED_POWERMETRICS_CONFIG_JSON) as IProfilerConfig
				)
				const localConfig = {
					runtimeOptions: GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions
				}
				configureConfig_spy.mockResolvedValue({
					mainConfig: mainConfig,
					localConfig: localConfig
				})
				confirmConfigFileContent_spy.mockResolvedValue(true)
				confirmOverwriteContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Main Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(mainConfig, null, 2))
				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Local Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(localConfig, null, 2))
				expect(configStoreToFile_spy).toHaveBeenCalledWith(mainConfig.filePath)
				expect(intermediateConfigStoreToFile_spy).toHaveBeenCalledWith(
					new UnifiedPath(process.cwd()).join('.oaklean.local'),
					localConfig
				)
			})

			test('returns true with none', async () => {
				const mainConfig = new ProfilerConfig(
					new UnifiedPath(process.cwd()).join('.oaklean'),
					ProfilerConfig.intermediateFromJSON(GENERATED_NONE_CONFIG_JSON) as IProfilerConfig
				)
				const localConfig = {
					runtimeOptions: GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions
				}
				configureConfig_spy.mockResolvedValue({
					mainConfig: mainConfig,
					localConfig: localConfig
				})
				confirmConfigFileContent_spy.mockResolvedValue(true)
				confirmOverwriteContent_spy.mockResolvedValue(true)

				await initCommands.initCommand()

				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Main Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(mainConfig, null, 2))
				expect(consoleSuccessLog_spy).toHaveBeenCalledWith('[Local Config]')
				expect(consoleLog_spy).toHaveBeenCalledWith(JSON.stringify(localConfig, null, 2))
				expect(configStoreToFile_spy).toHaveBeenCalledWith(mainConfig.filePath)
				expect(intermediateConfigStoreToFile_spy).toHaveBeenCalledWith(
					new UnifiedPath(process.cwd()).join('.oaklean.local'),
					localConfig
				)
			})

			test('returns true + false', async () => {
				configAlreadyExists_spy.mockReturnValue(true)
				const mainConfig = new ProfilerConfig(
					new UnifiedPath(process.cwd()).join('.oaklean'),
					ProfilerConfig.intermediateFromJSON(GENERATED_NONE_CONFIG_JSON) as IProfilerConfig
				)
				const localConfig = {
					runtimeOptions: GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions
				}
				configureConfig_spy.mockResolvedValue({
					mainConfig: mainConfig,
					localConfig: localConfig
				})
				confirmConfigFileContent_spy.mockResolvedValue(true)
				confirmOverwriteContent_spy.mockResolvedValue(false)

				await initCommands.initCommand()

				expect(consoleLog_spy).not.toHaveBeenCalledWith()
				expect(configStoreToFile_spy).not.toHaveBeenCalled()
				expect(intermediateConfigStoreToFile_spy).not.toHaveBeenCalled()
			})

			test('returns false + false', async () => {
				configAlreadyExists_spy.mockReturnValue(true)
				const mainConfig = new ProfilerConfig(
					new UnifiedPath(process.cwd()).join('.oaklean'),
					ProfilerConfig.intermediateFromJSON(GENERATED_NONE_CONFIG_JSON) as IProfilerConfig
				)
				const localConfig = {
					runtimeOptions: GENERATED_POWERMETRICS_CONFIG_JSON.runtimeOptions
				}
				configureConfig_spy.mockResolvedValue({
					mainConfig: mainConfig,
					localConfig: localConfig
				})
				configureConfig_spy.mockResolvedValue(mainConfig)
				confirmConfigFileContent_spy.mockResolvedValue(false)
				confirmOverwriteContent_spy.mockResolvedValue(false)

				await initCommands.initCommand()

				expect(consoleLog_spy).not.toHaveBeenCalledWith()
				expect(configStoreToFile_spy).not.toHaveBeenCalled()
				expect(intermediateConfigStoreToFile_spy).not.toHaveBeenCalled()
			})
		})

	})
})