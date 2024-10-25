import os from 'os'

import {
	ProfilerConfig,
	Crypto,
	ProjectIdentifier_string,
	SensorInterfaceType,
	MicroSeconds_number,
	RegistryOptions,
	LoggerHelper
} from '@oaklean/profiler-core'
import { program } from 'commander'
import { confirm, select } from '@inquirer/prompts'

export default class InitCommands {
	constructor() {
		program
			.command('init')
			.description('Create a .oaklean config file')
			.action(this.initCommand.bind(this))
	}

	static init() {
		return new InitCommands()
	}

	async initCommand() {
		const config = await this.configureConfig()
		LoggerHelper.log(JSON.stringify(config, null, 2))

		if (await this.confirmConfigFileContent() === false) {
			return
		}
		if (config.getSensorInterfaceType() === SensorInterfaceType.perf) {
			LoggerHelper.log('perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md')
		}
		config.storeToFile(config.filePath)
	}

	async configureConfig(): Promise<ProfilerConfig> {
		const config = ProfilerConfig.getDefaultConfig()

		// select sensor interface
		const selectedSensorInterface = await this.selectSensorInterface()
		switch (selectedSensorInterface) {
			case undefined:
				config.runtimeOptions.sensorInterface = undefined
				break
			case SensorInterfaceType.perf:
				config.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.perf,
					options: {
						outputFilePath: 'energy-measurements.txt',
						sampleInterval: 100 as MicroSeconds_number,
					}
				}
				break
			case SensorInterfaceType.powermetrics:
				config.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.powermetrics,
					options: {
						outputFilePath: 'energy-measurements.plist',
						sampleInterval: 100 as MicroSeconds_number,
					}
				}
				break
			case SensorInterfaceType.windows:
				config.runtimeOptions.sensorInterface = {
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
		return config
	}

	async confirmConfigFileContent() {
		return await confirm({
			message: 'Is this OK? (yes)',
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