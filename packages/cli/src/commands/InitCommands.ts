import * as fs from 'fs'
import os from 'os'

import { UnifiedPath, ProjectReport, ProfilerConfig, Crypto, ProjectIdentifier_string, SensorInterfaceType, MicroSeconds_number } from '@oaklean/profiler-core'
import { program } from 'commander'
import { confirm, select } from '@inquirer/prompts'
import { RegistryOptions } from '@oaklean/profiler-core/dist/src/model/ProfilerConfig'

export default class InitCommands {
	constructor() {
		const parseCommand = program
			.command('init')
			.description('Create a .oaklean config file')
			.action(this.initCommand.bind(this))
	}

	static init() {
		return new InitCommands()
	}

	async initCommand() {
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
			default:
				break
		}

		config.projectOptions.identifier = Crypto.uniqueID() as ProjectIdentifier_string
		config.registryOptions = undefined as unknown as RegistryOptions
		if (fs.existsSync(config.filePath.toPlatformString())) {
			console.log(JSON.stringify(config, null, 2))
			const answer = await confirm({
				message: 'Is this OK? (yes)',
				default: true
			})
			if (answer === false) {
				return
			}
			if (config.getSensorInterfaceType() === SensorInterfaceType.perf) {
				console.log('perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md')
			}
		}
		config.storeToFile(config.filePath)
	}

	async selectSensorInterface(): Promise<SensorInterfaceType | undefined> {
		const sensorInterfacePerPlatform: Partial<Record<NodeJS.Platform, SensorInterfaceType>> = {
			'linux': SensorInterfaceType.perf,
			'darwin': SensorInterfaceType.powermetrics
		}

		const recommendedSensorInterface = `recommended for your platform: ${sensorInterfacePerPlatform[os.platform()]}` || 'No recommended sensor interface for this platform.'
		return await select<SensorInterfaceType | undefined>({
			message: `Select a sensor interface (${recommendedSensorInterface})`,
			choices: [
				{
					name: 'None',
					value: undefined,
					description: 'pure cpu time measurements without energy measurements',
				},
				{
					name: 'powermetrics',
					value: SensorInterfaceType.powermetrics,
					description: 'energy measurements on macOS',
				},
				{
					name: 'perf',
					value: SensorInterfaceType.perf,
					description: 'energy measurements on Linux (Intel & AMD CPUs only)',
				}
			],
		})
	}
}