import * as fs from 'fs'

import cli from 'cli-color'
import {
	UnifiedPath,
	CPUModel,
	NanoSeconds_BigInt,
	LoggerHelper,
	CPUNode,
	ProfilerConfig
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
		
		baseCommand
			.command('trace')
			.description('Displays the trace of the cpu profile')
			.argument('<input>', 'input file path')
			.action(this.trace.bind(this))
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

	async trace(input: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		function colorByType(cpuNode: CPUNode) {
			if (cpuNode.isLangInternal) {
				return cli.xterm(9)
			} else if (cpuNode.isWASM) {
				return cli.xterm(57)
			} else if (cpuNode.isWebpack) {
				return cli.xterm(39)
			} else if (cpuNode.relativeUrl.toString().includes('/node_modules/')) {
				return cli.xterm(11)
			}
			return (arg: string) => arg
		}

		const cpuProfile = JSON.parse(fs.readFileSync(inputPath.toPlatformString()).toString())

		const profilerConfig = ProfilerConfig.autoResolveFromPath(inputPath.dirName())

		const cpuModel = new CPUModel(
			profilerConfig.getRootDir(),
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		function traverse(
			cpuNode: CPUNode,
			parentsPaint: ((arg: string) => string)[] = [],
			last: boolean[] = [] // specifies wether the parents are the last children
		) {
			if (cpuNode.index === 0) {
				LoggerHelper.log(cli.xterm(9)(' ■ ') + cli.green('({root})'))
			} else {
				let indent = ''
				for (let i = 0; i < last.length - 1; i++) {
					if (last[i]) {
						indent += '    '
					} else {
						indent += parentsPaint[i]('│   ')
					}
				}
				const selfPaint = colorByType(cpuNode)
				const prefix = selfPaint(' ■ ')
				const lastIndent = parentsPaint[parentsPaint.length - 1](
					(last[last.length - 1] ? '└' : '├')
				) + selfPaint('── ')

				console.log(
					prefix +
					indent +
					lastIndent +
					cpuNode.relativeUrl.toString() +
					cli.green(` (${cpuNode.ISourceLocation.callFrame.functionName})`),
					`- ${cpuNode.cpuTime.selfCPUTime} µs | ${cpuNode.cpuTime.aggregatedCPUTime} µs`
				)
			}
			
			const nodes = Array.from(cpuNode.children())
			for (let i = 0; i < nodes.length; i++) {
				traverse(
					nodes[i],
					[...parentsPaint, colorByType(cpuNode)],
					[...last, i === nodes.length - 1]
				)
			}
		}

		// vertical legend
		console.log(
			'\nLegend:\n' +
			' ■ ' + ' Node (own code)\n' +
			cli.xterm(9)(' ■ ') + ' Node (node internal)\n' +
			cli.xterm(11)(' ■ ') + ' Node (node module)\n' +
			cli.xterm(57)(' ■ ') + ' Node (WebAssembly)\n' + 
			cli.xterm(39)(' ■ ') + ' Node (Webpack)\n'
		)

		traverse(cpuModel.getNode(0))
	}
}