import * as fs from 'fs'

import { UnifiedPath, TypescriptParser, JestAdapter, TypeScriptAdapter } from '@oaklean/profiler-core'
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

		const transpileCommand = program
			.command('transpile')
			.description('commands to parse javascript or typescript files')

		transpileCommand
			.command('withJest')
			.description('Transpiles a given javascript/typescript file with jest and stores the transpiled code into a file')
			.argument('<input>', 'input file path')
			.argument('<jestConfig>', 'jest config file path')
			.argument('<output>', 'output file path')
			.action(this.transpileWithJest.bind(this))

		transpileCommand
			.command('withTS')
			.description('Transpiles a given javascript/typescript file with typescript and stores the transpiled code into a file')
			.argument('<input>', 'input file path')
			.argument('<output>', 'output file path')
			.action(this.transpileWithTypescript.bind(this))
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

	async transpileWithJest(input: string, jestConfig: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let jestConfigPath = new UnifiedPath(jestConfig)
		if (jestConfigPath.isRelative()) {
			jestConfigPath = new UnifiedPath(process.cwd()).join(jestConfigPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const { config, context } = JSON.parse(fs.readFileSync(jestConfigPath.toPlatformString()).toString())

		const jestAdapter = new JestAdapter(config, context)

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}

		fs.writeFileSync(outputPath.toPlatformString(), await jestAdapter.process(inputPath))
	}

	async transpileWithTypescript(input: string, output: string) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		let outputPath = new UnifiedPath(output)
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const outDir = outputPath.dirName()

		const typeScriptAdapter = new TypeScriptAdapter()

		if (!fs.existsSync(outDir.toPlatformString())) {
			fs.mkdirSync(outDir.toPlatformString(), { recursive: true })
		}
		console.log(outputPath.toPlatformString())

		fs.writeFileSync(outputPath.toPlatformString(), await typeScriptAdapter.process(inputPath))
	}
}