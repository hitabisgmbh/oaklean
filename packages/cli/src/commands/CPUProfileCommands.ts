import * as fs from 'fs'

import {
	UnifiedPath,
	CPUModel,
	NanoSeconds_BigInt,
	LoggerHelper,
	CPUNode
} from '@oaklean/profiler-core'
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

		baseCommand
			.command('inspect')
			.description('Displays an overview of the cpu profile stats')
			.argument('<input>', 'input file path')
			.action(this.inspect.bind(this))
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

	async inspect(input: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const cpuProfile = JSON.parse(fs.readFileSync(inputPath.toPlatformString()).toString())
		const cpuModel = new CPUModel(
			new UnifiedPath(__dirname).join('..'),
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		const nodeCount = cpuModel.INodes.length
		const sourceNodeLocationCount = cpuModel.ILocations.length
		const sampleCount = cpuModel.samples.length
		let totalHits = 0
		let totalCPUTime = 0

		function traverse(cpuNode: CPUNode) {
			for (const child of cpuNode.children()) {
				totalCPUTime += child.cpuTime.selfCPUTime || 0
				totalHits += child.profilerHits
				traverse(child)
			}
		}

		traverse(cpuModel.getNode(0))

		LoggerHelper.table([{
			type: 'Node Count',
			value: nodeCount
		},
		{
			type: 'Source Node Location Count',
			value: sourceNodeLocationCount
		},
		{
			type: 'Sample Count',
			value: sampleCount
		},
		{
			type: 'Total Hits',
			value: totalHits
		},
		{
			type: 'Total CPU Time',
			value: totalCPUTime,
			unit: 'µs'
		}
		], ['type', 'value', 'unit'])
	}
}