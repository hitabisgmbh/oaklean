import * as fs from 'fs'

import {
	UnifiedPath,
	TypescriptParser
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class CodeParsingCommands {
	constructor() {
		const parseCommand = program
			.command('parse')
			.description('commands to parse javascript or typescript files')

		parseCommand
			.command('toPST')
			.description('Converts a given javascript/typescript file and extracts the ProgramStructureTree from it and stores it into a file')
			.argument('<input>', 'input file path')
			.argument('<output>', 'output file path')
			.action(this.convertToProgramStructureTree.bind(this))
	}

	static init() {
		return new CodeParsingCommands()
	}

	async convertToProgramStructureTree(input: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const programStructureTree = TypescriptParser.parseFile(inputPath)

		if (!fs.existsSync(outDir.toString())) {
			fs.mkdirSync(outDir.toString(), { recursive: true })
		}

		fs.writeFileSync(outputPath.toPlatformString(), JSON.stringify(programStructureTree, null, 2))
	}
}