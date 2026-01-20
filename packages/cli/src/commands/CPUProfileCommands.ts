import cli from 'cli-color'
import {
	UnifiedPath,
	CPUModel,
	NanoSeconds_BigInt,
	LoggerHelper,
	CPUNode,
	ProfilerConfig,
	CPUProfileHelper,
	STATIC_CONFIG_FILENAME,
	ResolveFunctionIdentifierHelper,
	ExternalResourceHelper,
	ExportAssetHelper
} from '@oaklean/profiler-core'
import { program } from 'commander'
import bare from 'cli-color/bare'

enum TraceColors {
	LangInternal = 9,
	External = 11,
	WebAssembly = 57,
	Webpack = 39
}

export default class CPUProfileCommands {
	constructor() {
		const baseCommand = program
			.command('profile')
			.description("commands to convert or inspect the cpu profile's format")

		baseCommand
			.command('toCPUModel')
			.description(
				'Converts a cpu profile format that is given to a cpu model format'
			)
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
			.option(
				'-r, --root-dir <rootdir>',
				'specify which root dir should be used, if not set it will be determined by the config file',
				undefined
			)
			.option(
				'-e, --external-resources [external-resources]',
				'external resources file path - When provided, this improves file resolution accuracy and ensures source maps are taken into account.',
				undefined
			)
			.action(this.trace.bind(this))

		baseCommand
			.command('anonymize')
			.description(
				'Converts all paths in the cpu profile to relative paths ' +
					`(relative to the rootDir mentioned in the ${STATIC_CONFIG_FILENAME} config)` +
					' to remove all user related paths'
			)
			.argument('<input>', 'input file path')
			.option(
				'-o, --output <output>',
				'output file path (default: input file path)'
			)
			.action(this.anonymize.bind(this))
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

		const cpuProfile = await CPUProfileHelper.loadFromFile(inputPath)
		if (cpuProfile === undefined) {
			LoggerHelper.error(
				`CPU profile could not be loaded from ${inputPath.toPlatformString()}. ` +
					'Please make sure the file exists and is a valid CPU profile.'
			)
			return
		}
		const cpuModel = new CPUModel(
			new UnifiedPath(__dirname).join('..'),
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		await cpuModel.storeToFile(outputPath)
	}

	async inspect(input: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const cpuProfile = await CPUProfileHelper.loadFromFile(inputPath)
		if (cpuProfile === undefined) {
			LoggerHelper.error(
				`CPU profile could not be loaded from ${inputPath.toPlatformString()}. ` +
					'Please make sure the file exists and is a valid CPU profile.'
			)
			return
		}
		const cpuModel = new CPUModel(
			new UnifiedPath(__dirname).join('..'),
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		const nodeCount = cpuModel.INodes.length
		const sourceNodeLocationCount = cpuModel.CPUProfileSourceLocations.length
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

		LoggerHelper.table(
			[
				{
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
			],
			['type', 'value', 'unit']
		)
	}

	async trace(
		input: string,
		options: {
			externalResources?: string | true
			rootDir?: string
		}
	) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}
		let externalResourcesInput = options.externalResources
		if (externalResourcesInput === true) {
			externalResourcesInput = new ExportAssetHelper(inputPath.dirName())
				.outputExternalResourceHelperPath(inputPath.filename())
				.toPlatformString()
			LoggerHelper.log(
				'No external resources file provided, attempting to determine one automatically.',
				`Using: ${externalResourcesInput}`
			)
		}
		const cpuProfile = await CPUProfileHelper.loadFromFile(inputPath)
		if (cpuProfile === undefined) {
			LoggerHelper.error(
				`CPU profile could not be loaded from ${inputPath.toPlatformString()}. ` +
					'Please make sure the file exists and is a valid CPU profile.'
			)
			return
		}
		let rootDir: UnifiedPath
		if (options.rootDir !== undefined) {
			rootDir = new UnifiedPath(options.rootDir)
		} else {
			const profilerConfig = ProfilerConfig.autoResolveFromPath(
				inputPath.dirName()
			)
			rootDir = profilerConfig.getRootDir()
		}

		let resolveFunctionIdentifierHelper:
			| ResolveFunctionIdentifierHelper
			| undefined
		let externalResourceHelper: ExternalResourceHelper | undefined
		if (externalResourcesInput !== undefined) {
			let resourcesHelperPath = new UnifiedPath(externalResourcesInput)
			if (resourcesHelperPath.isRelative()) {
				resourcesHelperPath = new UnifiedPath(process.cwd()).join(
					resourcesHelperPath
				)
			}
			externalResourceHelper = ExternalResourceHelper.loadFromFile(
				rootDir,
				resourcesHelperPath
			)
			if (externalResourceHelper === undefined) {
				LoggerHelper.warn(
					'Failed to load external resources file. Check if the file exists and is valid.'
				)
			} else {
				resolveFunctionIdentifierHelper = new ResolveFunctionIdentifierHelper(
					rootDir,
					externalResourceHelper
				)
			}
		}

		function colorByType(cpuNode: CPUNode, resolvedAsExternal: boolean) {
			if (cpuNode.sourceLocation.isLangInternal) {
				return cli.xterm(TraceColors.LangInternal)
			} else if (cpuNode.sourceLocation.isWASM) {
				return cli.xterm(TraceColors.WebAssembly)
			} else if (cpuNode.sourceLocation.isWebpack) {
				return cli.xterm(TraceColors.Webpack)
			} else if (
				resolvedAsExternal ||
				cpuNode.sourceLocation.relativeUrl.toString().includes('/node_modules/')
			) {
				return cli.xterm(TraceColors.External)
			}
			return (arg: string) => arg
		}

		const cpuModel = new CPUModel(
			rootDir,
			cpuProfile,
			BigInt(0) as NanoSeconds_BigInt
		)

		async function traverse(
			cpuNode: CPUNode,
			parentsPaint: ((arg: string) => string)[] = [],
			last: boolean[] = [] // specifies wether the parents are the last children
		) {
			let selfPaint: bare.Format | ((arg: string) => string) = colorByType(
				cpuNode,
				false
			)
			if (cpuNode.index === 0) {
				const resolvedPrefix =
					resolveFunctionIdentifierHelper !== undefined
						? cli.xterm(TraceColors.LangInternal)('■ ')
						: ''
				LoggerHelper.log(
					resolvedPrefix +
						cli.xterm(TraceColors.LangInternal)('■ ') +
						cli.green('({root})')
				)
			} else {
				let indent = ''
				for (let i = 0; i < last.length - 1; i++) {
					if (last[i]) {
						indent += '  '
					} else {
						indent += parentsPaint[i]('│ ')
					}
				}

				const originalPrefix = selfPaint('■ ')
				let resolvedPrefix = ''
				let relativeFilePath = cpuNode.sourceLocation.relativeUrl.toString()
				let resolvedFunctionName = ''
				if (resolveFunctionIdentifierHelper !== undefined) {
					if (
						!cpuNode.sourceLocation.isLangInternal &&
						!cpuNode.sourceLocation.isWASM
					) {
						const { sourceNodeLocation, nodeModule, relativeNodeModulePath } =
							await resolveFunctionIdentifierHelper.resolveFunctionIdentifier(
								cpuNode.sourceLocation
							)
						relativeFilePath = sourceNodeLocation.relativeFilePath.toString()
						const functionIdentifierParts =
							sourceNodeLocation.functionIdentifier.split('.')
						resolvedFunctionName =
							functionIdentifierParts[functionIdentifierParts.length - 1]
						if (relativeNodeModulePath !== null && nodeModule !== null) {
							// change color to node module
							selfPaint = colorByType(cpuNode, true)
						}
					}
					resolvedPrefix = selfPaint('■ ')
				}

				const lastIndent =
					parentsPaint[parentsPaint.length - 1](
						last[last.length - 1] ? '└' : '├'
					) + selfPaint('─ ')

				console.log(
					originalPrefix +
						resolvedPrefix +
						indent +
						lastIndent +
						relativeFilePath +
						(resolvedFunctionName !== ''
							? cli.green(` ${resolvedFunctionName}`)
							: '') +
						cli.green(` (${cpuNode.sourceLocation.rawFunctionName})`) +
						`[CM_ID: ${cpuNode.index}]`,
					`[LOC_ID: ${cpuNode.sourceLocation.index}]`,
					`[SCRIPT_ID: ${cpuNode.sourceLocation.scriptID} | ${cpuNode.sourceLocation.isLangInternal}]`,
					`- ${cpuNode.cpuTime.selfCPUTime} µs | ${cpuNode.cpuTime.aggregatedCPUTime} µs`
				)
			}

			const nodes = Array.from(cpuNode.children())
			for (let i = 0; i < nodes.length; i++) {
				await traverse(
					nodes[i],
					[...parentsPaint, selfPaint],
					[...last, i === nodes.length - 1]
				)
			}
		}

		// vertical legend
		LoggerHelper.log(
			'\nLegend:\n' +
				' ■ ' +
				' Node (own code)\n' +
				cli.xterm(TraceColors.LangInternal)(' ■ ') +
				' Node (node internal)\n' +
				cli.xterm(TraceColors.External)(' ■ ') +
				' Node (node module)\n' +
				cli.xterm(TraceColors.WebAssembly)(' ■ ') +
				' Node (WebAssembly)\n' +
				cli.xterm(TraceColors.Webpack)(' ■ ') +
				' Node (Webpack)\n'
		)

		if (resolveFunctionIdentifierHelper !== undefined) {
			LoggerHelper.log(
				'┌───' +
					' originally from the cpu profile\n' +
					'│ ┌─' +
					' resolved via the external resource (using sourcemaps)\n' +
					'│ │ '
			)
		}

		await traverse(cpuModel.getNode(0))
	}

	async anonymize(input: string, options: { output?: string }) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath
		if (options.output === undefined) {
			outputPath = inputPath.copy()
		} else {
			outputPath = new UnifiedPath(options.output)
			if (outputPath.isRelative()) {
				outputPath = new UnifiedPath(process.cwd()).join(outputPath)
			}
		}

		const profilerConfig = ProfilerConfig.autoResolveFromPath(
			inputPath.dirName()
		)

		await CPUProfileHelper.anonymize(
			profilerConfig.getRootDir(),
			inputPath,
			outputPath
		)
	}
}
