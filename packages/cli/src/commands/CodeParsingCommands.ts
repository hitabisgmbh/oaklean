import * as fs from 'fs'

import { sync } from 'glob'
import {
	UnifiedPath,
	TypescriptParser,
	ExternalResourceHelper,
	LoggerHelper,
	ScriptID_string,
	UnifiedPath_string,
	ExportAssetHelper,
	EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION,
	PermissionHelper
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

		parseCommand
			.command('verify-identifiers')
			.alias('vi')
			.description('Parses all source files (.js, .ts, .jsx, .tsx) within a given path and verifies that all identifiers are valid and unique')
			.argument('<input>', 'input file path')
			.option('--t262', 'Specifies whether files should be ignored that contain a "$DONOTEVALUATE();", this is useful for test262 source files')
			.action(this.verifySourceFilesIdentifiers.bind(this))

		const externalResourceCommand = program
			.command('external-resource')
			.alias('er')
			.description(
				'commands to interact with external resource files ' +
				`(${EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION})`
			)

		externalResourceCommand
			.command('verify-identifiers')
			.alias('vi')
			.description('Parses all source files in all resource files within a given path and verifies that all identifiers are valid and unique')
			.argument('<input>', `File path to the directory containing the ${EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION} files`)
			.action(this.verifyIdentifiers.bind(this))

		externalResourceCommand
			.command('extract')
			.alias('e')
			.description('Extract a file from a resource file and stores it into a separate file')
			.argument('<input>', `File path to the ${EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION} file`)
			.argument('<file>', 'File to extract from the resource file (scriptID or file path)')
			.option('-o, --output <output>', 'Path to store the file (default: execute directory + code.ts)', undefined)
			.action(this.extractFile.bind(this))
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

		const programStructureTree = TypescriptParser.parseFile(inputPath)

		programStructureTree.storeToFile(outputPath)
	}

	private verifyCode(
		code: string | null,
		addToDebug: {
			resourceFile?: string,
			scriptID?: ScriptID_string,
			filePath?: UnifiedPath_string
		}
	) {
		if (code === null) {
			return
		}
		const tmpName = (addToDebug.scriptID !== undefined ? addToDebug.scriptID : addToDebug.filePath) || 'tmp.ts'
		TypescriptParser.parseSource(new UnifiedPath(tmpName), code, 'TSX', (
			filePath,
			node,
			identifier: string,
			loc,
			duplicateLoc
		) => {
			LoggerHelper.warn('Duplicated identifier found:', {
				...addToDebug,
				identifier,
				original: loc,
				duplicate: duplicateLoc,
			})
		})
	}

	async verifySourceFilesIdentifiers(
		input: string,
		options: { t262?: boolean }
	) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}
		const globPattern = inputPath.join('**', '*.{js,ts,jsx,tsx}').toPlatformString()
		if (fs.existsSync(inputPath.toPlatformString())) {
			const filePaths = sync(globPattern.toString(), { dot: true })
			filePaths.map((filePath) => new UnifiedPath(filePath))

			for (const filePath of filePaths) {
				if (fs.statSync(filePath).isDirectory()) {
					continue
				}
				if (filePath.endsWith('.d.ts')) {
					continue // Skip declaration files
				}
				const sourceFilePath = new UnifiedPath(filePath)
				let code = fs.readFileSync(sourceFilePath.toPlatformString(), 'utf-8')
				if (options.t262 !== undefined && code.includes('$DONOTEVALUATE();')) {
					code = code.split('$DONOTEVALUATE();')[0]
				}
				try {
					this.verifyCode(code, {
						resourceFile: inputPath.toPlatformString(),
						filePath: sourceFilePath.toString()
					})
				} catch (error) {
					LoggerHelper.error(`Error parsing file ${sourceFilePath.toPlatformString()}:`, error)
					continue
				}
			}
		} else {
			LoggerHelper.error(`Input path does not exist: ${inputPath.toPlatformString()}`)
			return
		}
	}

	async verifyIdentifiers(
		input: string
	) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}

		const exportAssetHelper = new ExportAssetHelper(inputPath)
		const cwdPath = new UnifiedPath(process.cwd())
		const externalResourcePaths = exportAssetHelper.allExternalResourcePathsInOutputDir()

		for (const externalResourcePath of externalResourcePaths) {
			const relativePath = cwdPath.pathTo(externalResourcePath)

			const resourceFile = ExternalResourceHelper.loadFromFile(
				new UnifiedPath(process.cwd()),
				externalResourcePath
			)

			if (resourceFile === undefined) {
				LoggerHelper.error(`Could not load resource file: ${relativePath.toPlatformString()}`)
				continue
			}

			const scriptIDs = resourceFile.scriptIDs
			const filePaths = resourceFile.loadedFilePaths

			for (const scriptID of scriptIDs) {
				const code = await resourceFile.sourceCodeFromScriptID(scriptID)
				this.verifyCode(code, {
					resourceFile: relativePath.toPlatformString(),
					scriptID
				})
			}

			for (const filePath of filePaths) {
				const code = await resourceFile.sourceCodeFromPath(filePath, filePath)
				this.verifyCode(code, {
					resourceFile: relativePath.toPlatformString(),
					filePath
				})
			}
		}
	}

	async extractFile(
		input: string,
		file: string,
		options: {
			output: string
		}
	) {
		let inputPath = new UnifiedPath(input)
		if (inputPath.isRelative()) {
			inputPath = new UnifiedPath(process.cwd()).join(inputPath)
		}
		let outputPath = new UnifiedPath(options.output !== undefined ? options.output : 'code.ts')
		if (outputPath.isRelative()) {
			outputPath = new UnifiedPath(process.cwd()).join(outputPath)
		}
		const cwdPath = new UnifiedPath(process.cwd())
		const relativeInputPath = cwdPath.pathTo(inputPath)

		const resourceFile = ExternalResourceHelper.loadFromFile(new UnifiedPath(process.cwd()), inputPath)

		if (resourceFile === undefined) {
			LoggerHelper.error(`Could not load resource file: ${relativeInputPath.toPlatformString()}`)
			return
		}

		let code: string | null = ''
		if (resourceFile.scriptIDs.includes(file as ScriptID_string)) {
			code = await resourceFile.sourceCodeFromScriptID(file as ScriptID_string)
		} else if (resourceFile.loadedFilePaths.includes(file as UnifiedPath_string)) {
			code = await resourceFile.sourceCodeFromPath(file as UnifiedPath_string, file as UnifiedPath_string)
		} else {
			LoggerHelper.error(`File ${file} not found in resource file: ${relativeInputPath.toPlatformString()}`)
		}
		if (code === null) {
			LoggerHelper.error(`File '${file}' is marked as missing (was not present during profiling)`)
			return
		}

		PermissionHelper.writeFileWithUserPermission(outputPath, code)
	}
}