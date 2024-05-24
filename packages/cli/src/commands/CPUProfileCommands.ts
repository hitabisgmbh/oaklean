import * as fs from 'fs'

import { UnifiedPath, CPUModel, NanoSeconds_BigInt } from '@oaklean/profiler-core'
import { program } from 'commander'

export default class CPUProfileCommands {
	constructor() {
		const baseCommand = program
			.command('profile')
			.description('commands to convert or inspect the cpu profile\'s format')

		baseCommand
			.command('toCPUModel')
			.description('Converts a cpu profile format that is given to a cpu model format')
			.argument('<input>', 'input file path')
			.argument('<output>', 'output file path')
			.action(this.convertToCPUModel.bind(this))
	}

	static init() {
		return new CPUProfileCommands()
	}

	async convertToCPUModel(input: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const cpuProfile = JSON.parse(fs.readFileSync(inputPath.toPlatformString()).toString())
		const cpuModel = new CPUModel(
			new UnifiedPath(__dirname).join('..'),
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}

		fs.writeFileSync(outputPath.toPlatformString(), JSON.stringify(
			cpuModel,
			(key, value) =>
				typeof value === 'bigint'
					? value.toString()
					: value // return everything else unchanged
			, 2))
	}
}