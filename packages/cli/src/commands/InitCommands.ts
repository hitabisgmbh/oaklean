import os from 'os'
import * as fs from 'fs'

import {
	ProfilerConfig,
	ProfilerConfigCommentHelper,
	SensorInterfaceType,
	LoggerHelper,
	STATIC_CONFIG_FILENAME,
	IProfilerConfigFileRepresentation,
	UnifiedPath,
	STATIC_LOCAL_CONFIG_FILENAME,
	JsoncHelper
} from '@oaklean/profiler-core'
import { program } from 'commander'

let _inquirerPromptsModule: typeof import('@inquirer/prompts') | undefined =
	undefined
async function inquirerPromptsModule() {
	if (!_inquirerPromptsModule) {
		_inquirerPromptsModule = await import('@inquirer/prompts')
	}
	return _inquirerPromptsModule
}

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
		const { mainConfig, localConfig } = await this.configureConfig()
		LoggerHelper.appPrefix.success('[Main Config]')
		LoggerHelper.log(
			JsoncHelper.highlightJsoncComments(
				ProfilerConfigCommentHelper.addDefaultCommentsToConfigFileContent(
					JSON.stringify(mainConfig, null, 2)
				)
			)
		)
		LoggerHelper.appPrefix.success('[Local Config]')
		LoggerHelper.log(
			JsoncHelper.highlightJsoncComments(
				ProfilerConfigCommentHelper.addDefaultCommentsToConfigFileContent(
					JSON.stringify(localConfig, null, 2)
				)
			)
		)

		if ((await this.confirmConfigFileContent()) === false) {
			return
		}
		if (
			ProfilerConfig.getSensorInterfaceType(localConfig) ===
			SensorInterfaceType.perf
		) {
			LoggerHelper.appPrefix.log(
				'perf sensor interface selected, for more information how to setup perf see https://github.com/hitabisgmbh/oaklean/blob/main/docs/SensorInterfaces.md'
			)
		}
		const localConfigPath = new UnifiedPath(process.cwd()).join(
			STATIC_LOCAL_CONFIG_FILENAME
		)
		const existMainConfig = this.configAlreadyExists(mainConfig.filePath)
		const existLocalConfig = this.configAlreadyExists(localConfigPath)
		if (existMainConfig || existLocalConfig) {
			let message = 'The following config files already exist:\n'
			if (existMainConfig) {
				message += ` - ${mainConfig.filePath.toPlatformString()}\n`
			}
			if (existLocalConfig) {
				message += ` - ${localConfigPath.toPlatformString()}\n`
			}
			LoggerHelper.appPrefix.warn(message)
			if ((await this.confirmOverwriteContent()) === false) {
				return
			}
		}
		mainConfig.storeToFile(mainConfig.filePath, {
			addDefaultComments: true
		})
		ProfilerConfig.storeIntermediateToFile(localConfigPath, localConfig, {
			addDefaultComments: true
		})
	}

	configAlreadyExists(path: UnifiedPath): boolean {
		return fs.existsSync(path.toPlatformString())
	}

	async configureConfig(): Promise<{
		mainConfig: ProfilerConfig
		localConfig: IProfilerConfigFileRepresentation
	}> {
		const mainConfig = await ProfilerConfig.createMainConfig()
		const localConfig = await ProfilerConfig.createLocalConfig({
			selectedSensorInterface: await this.selectSensorInterface()
		})

		return {
			mainConfig,
			localConfig
		}
	}

	async confirmConfigFileContent() {
		return await (
			await inquirerPromptsModule()
		).confirm({
			message: 'Is this OK? (yes)',
			default: true
		})
	}

	async confirmOverwriteContent() {
		return await (
			await inquirerPromptsModule()
		).confirm({
			message: 'Are you sure you want to override the existing files? (yes)',
			default: true
		})
	}

	async selectSensorInterface(): Promise<SensorInterfaceType | undefined> {
		const sensorInterfacePerPlatform: Partial<
			Record<NodeJS.Platform, SensorInterfaceType>
		> = {
			linux: SensorInterfaceType.perf,
			darwin: SensorInterfaceType.powermetrics,
			win32: SensorInterfaceType.windows
		}

		const recommendedSensorInterface = sensorInterfacePerPlatform[os.platform()]
		const recommendedSensorInterfaceMessage =
			recommendedSensorInterface !== undefined
				? `recommended for your platform: ${recommendedSensorInterface}`
				: 'No recommended sensor interface for this platform.'
		return await (
			await inquirerPromptsModule()
		).select<SensorInterfaceType | undefined>({
			message: `Select a sensor interface (${recommendedSensorInterfaceMessage})`,
			choices: [
				{
					name: 'None (pure cpu time measurements)',
					value: undefined,
					description: 'pure cpu time measurements without energy measurements'
				},
				{
					name: 'powermetrics (macOS only)',
					value: SensorInterfaceType.powermetrics,
					description: 'energy measurements on macOS'
				},
				{
					name: 'perf (Linux only)',
					value: SensorInterfaceType.perf,
					description: 'energy measurements on Linux (Intel & AMD CPUs only)'
				},
				{
					name: 'windows (Windows only)',
					value: SensorInterfaceType.windows,
					description: 'energy measurements on Windows (Intel & AMD CPUs only)'
				}
			]
		})
	}
}
