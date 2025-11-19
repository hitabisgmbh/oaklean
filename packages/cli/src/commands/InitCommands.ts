import os from 'os'
import * as fs from 'fs'

import {
	ProfilerConfig,
	Crypto,
	ProjectIdentifier_string,
	SensorInterfaceType,
	MicroSeconds_number,
	RegistryOptions,
	LoggerHelper,
	STATIC_CONFIG_FILENAME,
	IProfilerConfigFileRepresentation,
	UnifiedPath,
	STATIC_LOCAL_CONFIG_FILENAME
} from '@oaklean/profiler-core'
import { program } from 'commander'
import { confirm, select } from '@inquirer/prompts'

export default class InitCommands {
	constructor() {
		program
			.command('init')
			.description(`Create a ${STATIC_CONFIG_FILENAME} config file`)
			.action(this.initCommand.bind(this))
	}

	static init() {
		return new InitCommands()
	}

	async initCommand() {
		const {
			mainConfig,
			localConfig
		} = await this.configureConfig()
		LoggerHelper.appPrefix.success('[Main Config]')
		LoggerHelper.log(JSON.stringify(mainConfig, null, 2))
		LoggerHelper.appPrefix.success('[Local Config]')
		LoggerHelper.log(JSON.stringify(localConfig, null, 2))

		if (await this.confirmConfigFileContent() === false) {
			return
		}
		if (ProfilerConfig.getSensorInterfaceType(localConfig) === SensorInterfaceType.perf) {
			LoggerHelper.appPrefix.log('perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md')
		}
		const localConfigPath = new UnifiedPath(process.cwd()).join(STATIC_LOCAL_CONFIG_FILENAME)
		const existMainConfig = fs.existsSync(mainConfig.filePath.toPlatformString())
		const existLocalConfig = fs.existsSync(localConfigPath.toPlatformString())
		if (existMainConfig || existLocalConfig) {
			let message = 'The following config files already exist:\n'
			if (existMainConfig) {
				message += ` - ${mainConfig.filePath.toPlatformString()}\n`
			}
			if (existLocalConfig) {
				message += ` - ${localConfigPath.toPlatformString()}\n`
			}
			LoggerHelper.appPrefix.warn(message)
			if (await this.confirmOverwriteContent() === false) {
				return
			}
		}
		mainConfig.storeToFile(mainConfig.filePath)
		ProfilerConfig.storeIntermediateToFile(
			localConfigPath,
			localConfig
		)
	}

	async configureConfig(): Promise<{
		mainConfig: ProfilerConfig,
		localConfig: IProfilerConfigFileRepresentation
	}> {
		const config = ProfilerConfig.getDefaultConfig()
		const localConfig: IProfilerConfigFileRepresentation = {}
		localConfig.runtimeOptions = {}
		// select sensor interface
		const selectedSensorInterface = await this.selectSensorInterface()
		switch (selectedSensorInterface) {
			case undefined:
				localConfig.runtimeOptions.sensorInterface = undefined
				break
			case SensorInterfaceType.perf:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.perf,
					options: {
						outputFilePath: 'energy-measurements.txt',
						sampleInterval: 100 as MicroSeconds_number,
					}
				}
				break
			case SensorInterfaceType.powermetrics:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.powermetrics,
					options: {
						outputFilePath: 'energy-measurements.plist',
						sampleInterval: 100 as MicroSeconds_number,
					}
				}
				break
			case SensorInterfaceType.windows:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.windows,
					options: {
						outputFilePath: 'energy-measurements.csv',
						sampleInterval: 100 as MicroSeconds_number,
					}
				}
				break
			default:
				break
		}

		config.projectOptions.identifier = Crypto.uniqueID() as ProjectIdentifier_string
		config.registryOptions = undefined as unknown as RegistryOptions
		// remove runtime options from main config
		config.runtimeOptions = undefined as unknown as typeof config.runtimeOptions
		return {
			mainConfig: config,
			localConfig: localConfig
		}
	}

	async confirmConfigFileContent() {
		return await confirm({
			message: 'Is this OK? (yes)',
			default: true
		})
	}

	async confirmOverwriteContent() {
		return await confirm({
			message: 'Are you sure you want to override the existing files? (yes)',
			default: true
		})
	}

	async selectSensorInterface(): Promise<SensorInterfaceType | undefined> {
		const sensorInterfacePerPlatform: Partial<Record<NodeJS.Platform, SensorInterfaceType>> = {
			'linux': SensorInterfaceType.perf,
			'darwin': SensorInterfaceType.powermetrics,
			'win32': SensorInterfaceType.windows
		}

		const recommendedSensorInterface = sensorInterfacePerPlatform[os.platform()]
		const recommendedSensorInterfaceMessage = recommendedSensorInterface !== undefined ?
			`recommended for your platform: ${recommendedSensorInterface}` :
			'No recommended sensor interface for this platform.'
		return await select<SensorInterfaceType | undefined>({
			message: `Select a sensor interface (${recommendedSensorInterfaceMessage})`,
			choices: [
				{
					name: 'None (pure cpu time measurements)',
					value: undefined,
					description: 'pure cpu time measurements without energy measurements',
				},
				{
					name: 'powermetrics (macOS only)',
					value: SensorInterfaceType.powermetrics,
					description: 'energy measurements on macOS',
				},
				{
					name: 'perf (Linux only)',
					value: SensorInterfaceType.perf,
					description: 'energy measurements on Linux (Intel & AMD CPUs only)',
				},
				{
					name: 'windows (Windows only)',
					value: SensorInterfaceType.windows,
					description: 'energy measurements on Windows (Intel & AMD CPUs only)',
				}
			],
		})
	}
}