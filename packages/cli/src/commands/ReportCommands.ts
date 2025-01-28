import * as fs from 'fs'

import {
	LangInternalPath_string,
	LoggerHelper,
	NodeModule,
	ProgramStructureTree,
	ProjectReport,
	SourceFileMetaDataTree,
	TypescriptParser,
	UnifiedPath,
	UnifiedPath_string
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class ReportCommand {
	constructor() {
		const baseCommand = program
			.command('report')
			.description('commands to convert or inspect the profiler\'s format')

		baseCommand
			.command('toHash')
			.description('Calculates the hash of given a profiler format')
			.argument('<input>', 'input file path')
			.action(this.toHash.bind(this))

		baseCommand
			.command('toJSON')
			.description('Converts a profiler format that is given in binary format to a json version')
			.argument('<input>', 'input file path')
			.argument('<output>', 'output file path')
			.action(this.convertToJSON.bind(this))

		baseCommand
			.command('toSourceFileTree')
			.description('Converts a profiler format that is given in binary format to a SourceFileMetaDataTree')
			.argument('<input>', 'input file path')
			.argument('<output>', 'output file path')
			.action(this.convertToSourceFileMetaDataTreeTree.bind(this))

		baseCommand
			.command('check')
			.description('Checks wether all files in the profiler format are present')
			.option('-sn, --source-nodes', 'Specifies if source nodes should also be checked', false)
			.argument('<input>', 'input file path')
			.action(this.check.bind(this))

		baseCommand
			.command('inspect')
			.description('Displays an overview of the reports stats')
			.argument('<input>', 'input file path')
			.option('-lm, --list-modules', 'Displays a list of node modules', false)
			.action(this.inspect.bind(this))
	}

	static init() {
		return new ReportCommand()
	}

	async toHash(input: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}
		const report = ProjectReport.loadFromFile(inputPath, 'bin')
		if (report === undefined) {
			LoggerHelper.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}
	}

	async convertToJSON(input: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const report = ProjectReport.loadFromFile(inputPath, 'bin')
		if (report === undefined) {
			LoggerHelper.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}

		report.storeToFile(outputPath, 'pretty-json')
	}

	async convertToSourceFileMetaDataTreeTree(input: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const report = ProjectReport.loadFromFile(inputPath, 'bin')
		if (report === undefined) {
			LoggerHelper.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}

		const tree = SourceFileMetaDataTree.fromProjectReport(report).filter(undefined, undefined).node
		if (tree === null) {
			LoggerHelper.error('Could not create SourceFileMetaDataTree')
			return
		}

		tree.storeToFile(outputPath, 'pretty-json')
	}

	async check(input: string, options: { sourceNodes: boolean }) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const report = ProjectReport.loadFromFile(inputPath, 'bin')
		if (report === undefined) {
			LoggerHelper.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}
		const reversePathMap = report.globalIndex.getModuleIndex('get')?.reversePathMap

		if (reversePathMap === undefined) {
			LoggerHelper.error('Could not find reversePathMap')
			return
		}

		const pstPerFile = new Map<
		UnifiedPath_string | LangInternalPath_string,
		ProgramStructureTree
		>()

		for (const pathIndex of reversePathMap.values()) {
			if (!fs.existsSync(new UnifiedPath(pathIndex.identifier).toPlatformString())) {
				LoggerHelper.error(`Could not find file ${pathIndex.identifier}`)
				continue
			}

			if (options.sourceNodes) {
				let pst = pstPerFile.get(pathIndex.identifier)
				if (pst === undefined) {
					pst = TypescriptParser.parseFile(new UnifiedPath(pathIndex.identifier))
					pstPerFile.set(pathIndex.identifier, pst)
				}

				const notFoundSourceNodes = []

				for (const sourceNodeIndex of pathIndex.reverseSourceNodeMap.values()) {
					if (sourceNodeIndex.presentInOriginalSourceCode) {
						if (pst.sourceLocationOfIdentifier(sourceNodeIndex.identifier) === undefined) {
							notFoundSourceNodes.push(sourceNodeIndex.identifier)
						}
					}
				}
				if (notFoundSourceNodes.length > 0) {
					LoggerHelper.error(`Could not find source nodes in file ${pathIndex.identifier}`)
					LoggerHelper.table(notFoundSourceNodes)
				}
			}
		}

		const nodeModulePath = new UnifiedPath(process.cwd()).join('node_modules')
		for (const [nodeModuleIdentifier, moduleIndex] of report.globalIndex.moduleMap.entries()) {
			if (nodeModuleIdentifier === '{self}' || nodeModuleIdentifier === '{node}') {
				continue
			}
			const nodeModule = NodeModule.fromIdentifier(nodeModuleIdentifier)
			if (nodeModule.name === '{wasm}') {
				continue
			}

			for (const pathIndex of moduleIndex.reversePathMap.values()) {
				const relativeNodeModulePath = new UnifiedPath(nodeModule.name, pathIndex.identifier)
				const filePath = nodeModulePath.join(relativeNodeModulePath).toPlatformString()
				if (!fs.existsSync(filePath)) {
					LoggerHelper.error(`Could not find file ${relativeNodeModulePath}`)
				}
			}
		}
	}

	async inspect(input: string, options: { listModules: boolean }) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const report = ProjectReport.loadFromFile(inputPath, 'bin')
		if (report === undefined) {
			LoggerHelper.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}

		const node_modules = []
		for (const key of report.globalIndex.moduleMap.keys()) {
			if (key === '{self}' || key === '{node}') {
				continue
			}
			node_modules.push(key)
		}

		const total = report.totalAndMaxMetaData().total

		LoggerHelper.table([
			{
				type: 'Node modules count',
				value: node_modules.length
			},
			{
				type: 'Total cpu time',
				value: total.sensorValues.aggregatedCPUTime,
				unit: 'µs'
			},
			{
				type: 'Total cpu energy',
				value: total.sensorValues.aggregatedCPUEnergyConsumption,
				unit: 'mJ'
			},
			{
				type: 'Total ram energy',
				value: total.sensorValues.aggregatedRAMEnergyConsumption,
				unit: 'mJ'
			}
		], ['type', 'value', 'unit'])

		if (options.listModules) {
			LoggerHelper.log('Node modules:')
			LoggerHelper.table(node_modules)
		}
	}
}