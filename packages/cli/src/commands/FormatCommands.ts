import * as fs from 'fs'

import { ProjectReport, SourceFileMetaDataTree, UnifiedPath } from '@oaklean/profiler-core'
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
			console.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}

		console.log(report.hash())
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
			console.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
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
			console.error(`Could not find a profiler report at ${inputPath.toPlatformString()}`)
			return
		}

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}

		const tree = SourceFileMetaDataTree.fromProjectReport(report)
		tree.storeToFile(outputPath, 'pretty-json')
	}
}