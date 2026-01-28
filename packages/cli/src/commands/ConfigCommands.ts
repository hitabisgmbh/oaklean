import fs from 'fs'

import {
	UnifiedPath,
	LoggerHelper,
	ProfilerConfig
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class ConfigCommands {
	constructor() {
		const parseCommand = program
			.command('config')
			.description('commands to interact with a config file')

		parseCommand
			.command('resolve')
			.description(
				'Resolves the given config file and outputs the resolved config (including all default values and overrides)'
			)
			.argument('<input>', 'input file path')
			.action(this.resolve.bind(this))
	}

	static init() {
		return new ConfigCommands()
	}

	async resolve(input: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}
		if (!fs.existsSync(inputPath.toPlatformString())) {
			LoggerHelper.error(
				`The file ${inputPath.toPlatformString()} does not exist`
			)
			return
		}

		const config = await ProfilerConfig.resolveFromFile(inputPath)
		LoggerHelper.log(JSON.stringify(config, null, 2))
	}
}
