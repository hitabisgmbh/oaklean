import * as fs from 'fs'

import {
	LoggerHelper,
	NodeModule,
	ProjectReport,
	SourceFileMetaDataTree,
	UnifiedPath
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class FormatCommands {
	constructor() {
		const baseCommand = program
			.command('format')
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
			.argument('<input>', 'input file path')
			.action(this.check.bind(this))
	}

	static init() {
		return new FormatCommands()
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

		const tree = SourceFileMetaDataTree.fromProjectReport(report)
		tree.storeToFile(outputPath, 'pretty-json')
	}

	async check(input: string) {
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

		for (const pathIndex of reversePathMap.values()) {
			if (!fs.existsSync(new UnifiedPath(pathIndex.identifier).toPlatformString())) {
				LoggerHelper.error(`Could not find file ${pathIndex.identifier}`)
			}
		}

		const nodeModulePath = new UnifiedPath(process.cwd()).join('node_modules')
		for (const [nodeModuleIdentifier, moduleIndex] of report.globalIndex.moduleMap.entries()) {
			if (nodeModuleIdentifier === '{self}' || nodeModuleIdentifier === '{node}') {
				continue
			}
			const nodeModule = NodeModule.fromIdentifier(nodeModuleIdentifier)
			for (const pathIndex of moduleIndex.reversePathMap.values()) {
				const filePath = nodeModulePath.join(nodeModule.name, pathIndex.identifier).toPlatformString()
				if (!fs.existsSync(filePath)) {
					LoggerHelper.error(`Could not find file ${filePath}`)
				}
			}
		}
	}
}