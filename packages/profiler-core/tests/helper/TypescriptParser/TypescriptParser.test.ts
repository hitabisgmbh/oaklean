const tsMock = jest.mock('typescript', () => ({
	__esModule: true,
	...jest.requireActual('typescript'),
}))

import * as ts from 'typescript'

import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { LoggerHelper } from '../../../src'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('TypescriptParser', () => {
	it('should have a static method traverseSourceFile()', () => {
		expect(TypescriptParser.traverseSourceFile).toBeTruthy()
	})

	it('should have a static method parseFile()', () => {
		expect(TypescriptParser.parseFile).toBeTruthy()
	})

	describe('readConfigFile', () => {
		describe('parse errors', () => {
			let consoleErrorMock: jest.SpyInstance

			beforeEach(() => {
				consoleErrorMock = jest.spyOn(LoggerHelper, 'error')
				consoleErrorMock.mockImplementation(() => undefined)
			})

			afterEach(() => {
				consoleErrorMock.mockRestore()
			})

			it('prints error if the config file could not be parsed', () => {
				const parseConfigFileTextToJsonMock = jest.spyOn(ts, 'parseConfigFileTextToJson')
				parseConfigFileTextToJsonMock.mockReturnValue({ config: undefined })

				const configFilePath = CURRENT_DIR.join('assets', 'subDir', 'tsconfig.json').toPlatformString()

				const config = TypescriptParser.readConfigFile(configFilePath)
				parseConfigFileTextToJsonMock.mockRestore()

				expect(config).toBeUndefined()

				expect(consoleErrorMock).toBeCalledWith('TypescriptParser.readConfigFile could not parse the config file: ' + configFilePath)
			})

			it('prints error if the config file could not be parsed', () => {
				const expectedErrors = [{
					messageText: 'Test error',
					category: 1,
					code: 18003,
					file: undefined,
					start: undefined,
					length: undefined
				}]
				
				const parseJsonConfigFileContentMock = jest.spyOn(ts, 'parseJsonConfigFileContent')
				parseJsonConfigFileContentMock.mockReturnValue({
					options: {}, errors: expectedErrors, fileNames: [] })

				const configFilePath = CURRENT_DIR.join('assets', 'subDir', 'tsconfig.json').toPlatformString()

				const config = TypescriptParser.readConfigFile(configFilePath)
				parseJsonConfigFileContentMock.mockRestore()

				expect(config).toBeUndefined()

				expect(consoleErrorMock).toBeCalledWith('TypescriptParser.readConfigFile errors while parsing the config file: ' + configFilePath, JSON.stringify(expectedErrors, null, 2))
			})
		})

		

		it('parses correctly case 1', () => {
			const config = TypescriptParser.readConfigFile(CURRENT_DIR.join('assets', 'subDir', 'tsconfig.json').toPlatformString())

			expect(config?.options).toEqual({
				declaration: true,
				inlineSourceMap: true,
				target: 5,
				lib: ['lib.es2015.d.ts'],
				module: 1,
				resolveJsonModule: true,
				allowJs: true,
				esModuleInterop: true,
				forceConsistentCasingInFileNames: true,
				strict: true,
				noImplicitAny: true,
				skipLibCheck: true,
				configFilePath: undefined
			})

			expect(config?.fileNames).toEqual([CURRENT_DIR.join('assets', 'subDir', 'test.ts').toString()])
		})

		it('parses correctly case 1', () => {
			const config = TypescriptParser.readConfigFile(CURRENT_DIR.join('assets', 'tsconfig.json').toPlatformString())

			expect(config?.options).toEqual({
				declaration: true,
				inlineSourceMap: true,
				target: 3,
				lib: ['lib.es2015.d.ts'],
				module: 1,
				resolveJsonModule: true,
				allowJs: true,
				esModuleInterop: true,
				forceConsistentCasingInFileNames: true,
				strict: true,
				noImplicitAny: true,
				skipLibCheck: true,
				configFilePath: undefined
			})

			expect(config?.fileNames).toEqual([
				CURRENT_DIR.join('assets', 'test.ts').toString(),
				CURRENT_DIR.join('assets', 'subDir', 'test.ts').toString()
			])
		})
	})

	describe('tsConfigFromFile', () => {
		it('returns undefined if no config file exists', () => {

			const findConfigFileMock = jest.spyOn(ts, 'findConfigFile')
			findConfigFileMock.mockReturnValue(undefined)
			
			const configPath = TypescriptParser.tsConfigFilePathFromFile(CURRENT_DIR.toPlatformString())
			findConfigFileMock.mockRestore()

			expect(configPath).toBeUndefined()
		})

		it('resolves the correct tsconfig case 1', () => {
			const configPath = TypescriptParser.tsConfigFilePathFromFile(CURRENT_DIR.join('assets', 'test.ts').toPlatformString())

			expect(configPath).toBeDefined()
			if (configPath) {
				const relativePath = CURRENT_DIR.pathTo(configPath)

				expect(relativePath.toString()).toEqual('./assets/tsconfig.json')
			}
		})

		it('resolves the correct tsconfig case 2', () => {
			const configPath =  TypescriptParser.tsConfigFilePathFromFile(CURRENT_DIR.join('assets', 'subDir', 'test.ts').toPlatformString())

			expect(configPath).toBeDefined()
			if (configPath) {
				const relativePath = CURRENT_DIR.pathTo(configPath)

				expect(relativePath.toString()).toEqual('./assets/subDir/tsconfig.json')
			}
		})
	})
})