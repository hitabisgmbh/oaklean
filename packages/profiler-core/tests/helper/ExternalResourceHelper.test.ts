import * as inspector from '../__mocks__/inspector.mock'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { SourceMap } from '../../src/model/SourceMap'
import { NodeModule } from '../../src/model/NodeModule'
import { ExternalResourceHelper } from '../../src/helper/ExternalResourceHelper'
import { PermissionHelper } from '../../src/helper/PermissionHelper'
import { GitHelper } from '../../src/helper/GitHelper'
// Types
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { ScriptID_string } from '../../src/types'
import { GlobalIndex } from '../../src'

const ROOT_DIR = new UnifiedPath(__dirname).join('..', '..', '..', '..')

const SCRIPT_01_PATH = ROOT_DIR.join(
	'packages/profiler-core/tests/__mocks__/script01.js'
)
const SCRIPT_02_PATH = ROOT_DIR.join(
	'packages/profiler-core/tests/__mocks__/script02.js'
)
const SCRIPT_03_PATH = ROOT_DIR.join(
	'packages/profiler-core/tests/__mocks__/script03.js'
)

describe('ExternalResourceHelper', () => {
	describe('instance related', () => {
		let instance: ExternalResourceHelper

		beforeEach(async () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			moduleIndex.getFilePathIndex(
				'upsert',
				ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()
			)
			moduleIndex.getFilePathIndex(
				'upsert',
				ROOT_DIR.pathTo(SCRIPT_02_PATH).toString()
			)
			moduleIndex.getFilePathIndex(
				'upsert',
				ROOT_DIR.pathTo(SCRIPT_03_PATH).toString()
			)

			instance = new ExternalResourceHelper(ROOT_DIR)
			await instance.connect()
			await instance.listen()

			instance.parseFile(ROOT_DIR.pathTo(SCRIPT_01_PATH), SCRIPT_01_PATH)

			instance.parseFile(ROOT_DIR.pathTo(SCRIPT_02_PATH), SCRIPT_02_PATH)

			instance.parseFile(ROOT_DIR.pathTo(SCRIPT_03_PATH), SCRIPT_03_PATH)

			const nodeModulePath = new UnifiedPath('./node_modules/module')
			const absoluteNodeModulePath = ROOT_DIR.join(nodeModulePath)
			const nodeModuleSpy = jest
				.spyOn(NodeModule, 'fromNodeModulePath')
				.mockImplementation((path: UnifiedPath) => {
					if (path.toString() === absoluteNodeModulePath.toString()) {
						return new NodeModule('module', '1.2.3')
					}
				})
			instance.nodeModuleFromPath(nodeModulePath)
			nodeModuleSpy.mockRestore()

			const uncommittedFilesMock = jest
				.spyOn(GitHelper, 'uncommittedFiles')
				.mockImplementation(() => [SCRIPT_01_PATH])
			instance.trackUncommittedFiles(ROOT_DIR, globalIndex)
			uncommittedFilesMock.mockRestore()
		})

		it('instance should be an instanceof ExternalResourceHelper', () => {
			expect(instance instanceof ExternalResourceHelper).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(ExternalResourceHelper.fromJSON).toBeTruthy()
		})

		it('should have a method connect()', () => {
			expect(instance.connect).toBeTruthy()
		})

		it('should have a method storeToFile()', () => {
			expect(instance.storeToFile).toBeTruthy()
		})

		it('should have a static method loadFromFile()', () => {
			expect(ExternalResourceHelper.loadFromFile).toBeTruthy()
		})

		it('should have a method listen()', () => {
			expect(instance.listen).toBeTruthy()
		})

		it('should have a method disconnect()', () => {
			expect(instance.disconnect).toBeTruthy()
		})

		it('should have a method fillSourceMapsFromCPUProfile()', () => {
			expect(instance.fillSourceMapsFromCPUProfile).toBeTruthy()
		})

		it('should have a method fileInfoFromPath()', () => {
			expect(instance.fileInfoFromPath).toBeTruthy()

			expect(
				instance.fileInfoFromPath(
					ROOT_DIR.pathTo(SCRIPT_01_PATH),
					SCRIPT_01_PATH
				)
			).toEqual({
				sourceCode: inspector.SCRIPT_SOURCES['1'],
				cucc: true
			})
			expect(
				instance.fileInfoFromPath(
					ROOT_DIR.pathTo(SCRIPT_02_PATH),
					SCRIPT_02_PATH
				)
			).toEqual({
				sourceCode: inspector.SCRIPT_SOURCES['2']
			})
			expect(
				instance.fileInfoFromPath(
					ROOT_DIR.pathTo(SCRIPT_03_PATH),
					SCRIPT_03_PATH
				)
			).toEqual({
				sourceCode: inspector.SCRIPT_SOURCES['3']
			})
		})

		it('should have a method sourceCodeFromPath()', () => {
			expect(instance.sourceCodeFromPath).toBeTruthy()
		})

		it('should have a method sourceMapFromPath()', () => {
			expect(instance.sourceMapFromPath).toBeTruthy()
		})

		it('should have a method parseFile()', () => {
			expect(instance.parseFile).toBeTruthy()
		})

		it('should have a method fileInfoFromScriptID()', () => {
			expect(instance.fileInfoFromScriptID).toBeTruthy()
		})

		it('should have a method sourceCodeFromScriptID()', () => {
			expect(instance.sourceCodeFromScriptID).toBeTruthy()
		})

		it('should have a method sourceCodeFromScriptID()', () => {
			expect(instance.sourceCodeFromScriptID).toBeTruthy()
		})

		it('should have a getter scriptIDs', () => {
			expect(instance.scriptIDs).toEqual(['1', '2', '3'])
		})

		it('should have a getter uncommittedFiles', () => {
			expect(instance.uncommittedFiles).toEqual([
				ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()
			])
		})

		it('should have a getter loadedFilePaths', () => {
			expect(instance.loadedFilePaths).toEqual([
				ROOT_DIR.pathTo(SCRIPT_01_PATH).toString(),
				ROOT_DIR.pathTo(SCRIPT_02_PATH).toString(),
				ROOT_DIR.pathTo(SCRIPT_03_PATH).toString()
			])
		})

		test('getter rootDir', () => {
			expect(instance.rootDir.toString()).toEqual(ROOT_DIR.toString())
		})

		test('toJSON()', () => {
			expect(instance.toJSON()).toEqual({
				fileInfoPerScriptID: {
					'1': {
						sourceCode: inspector.SCRIPT_SOURCES['1']
					},
					'2': {
						sourceCode: inspector.SCRIPT_SOURCES['2']
					},
					'3': {
						sourceCode: inspector.SCRIPT_SOURCES['3']
					}
				},
				fileInfoPerPath: {
					[ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()]: {
						sourceCode: inspector.SCRIPT_SOURCES['1'],
						cucc: true
					},
					[ROOT_DIR.pathTo(SCRIPT_02_PATH).toString()]: {
						sourceCode: inspector.SCRIPT_SOURCES['2']
					},
					[ROOT_DIR.pathTo(SCRIPT_03_PATH).toString()]: {
						sourceCode: inspector.SCRIPT_SOURCES['3']
					}
				},
				nodeModules: {
					'./node_modules/module': {
						name: 'module',
						version: '1.2.3'
					}
				}
			})
		})

		test('fromJSON()', () => {
			const json = instance.toJSON()
			const newInstance = ExternalResourceHelper.fromJSON(ROOT_DIR, json)

			expect(instance.uncommittedFiles).toEqual(newInstance.uncommittedFiles)

			expect(newInstance.toJSON()).toEqual(json)
		})

		test('storeToFile()', async () => {
			const writeFileWithUserPermissionSpy = jest
				.spyOn(PermissionHelper, 'writeFileWithUserPermission')
				.mockImplementation(() => undefined)
			const filePath = new UnifiedPath(
				__dirname + '/externalResourceHelper.json'
			)

			await instance.storeToFile(filePath, 'json')

			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledTimes(1)
			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledWith(
				filePath,
				JSON.stringify(instance)
			)

			await instance.storeToFile(filePath, 'pretty-json')

			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledTimes(2)
			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledWith(
				filePath,
				JSON.stringify(instance, null, 2)
			)

			writeFileWithUserPermissionSpy.mockRestore()
		})

		test('sourceCodeFromId()', async () => {
			expect(
				await instance.sourceCodeFromScriptID('0' as ScriptID_string)
			).toBeNull()
		})

		test('loadFromFile', async () => {
			const filePath = new UnifiedPath(__dirname).join(
				'assets',
				'ExternalResourceHelper',
				'instance.json'
			)

			if (UPDATE_TEST_REPORTS) {
				PermissionHelper.writeFileWithUserPermission(
					filePath,
					JSON.stringify(instance, null, 2)
				)
			}

			const loadedInstance = ExternalResourceHelper.loadFromFile(
				ROOT_DIR,
				filePath
			)
			expect(loadedInstance).toBeDefined()
			if (loadedInstance) {
				expect(loadedInstance.toJSON()).toEqual(instance.toJSON())
			}
		})

		test('sourceMapFromId()', async () => {
			expect(
				await instance.sourceMapFromScriptID(
					'0' as ScriptID_string,
					SCRIPT_01_PATH
				)
			).toBeNull()

			expect(
				(
					await instance.sourceMapFromScriptID(
						'1' as ScriptID_string,
						SCRIPT_01_PATH
					)
				)?.toJSON()
			).toEqual(
				(
					SourceMap.fromCompiledJSString(
						SCRIPT_01_PATH,
						inspector.SCRIPT_SOURCES['1']
					) as SourceMap
				)?.toJSON()
			)
		})
	})

	describe('trackUncommittedFiles', () => {
		test('returns null if git is not available', () => {
			const uncommittedFilesMock = jest
				.spyOn(GitHelper, 'uncommittedFiles')
				.mockImplementation(() => null)
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const instance = new ExternalResourceHelper(ROOT_DIR)
			expect(instance.trackUncommittedFiles(ROOT_DIR, globalIndex)).toBe(null)
			uncommittedFilesMock.mockRestore()

			expect(instance.uncommittedFiles).toEqual(null)
			expect(instance.loadedFilePaths).toEqual([])
		})

		test('does not load files that were not included in the global index', () => {
			const uncommittedFilesMock = jest
				.spyOn(GitHelper, 'uncommittedFiles')
				.mockImplementation(() => [SCRIPT_01_PATH])
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const instance = new ExternalResourceHelper(ROOT_DIR)
			expect(instance.trackUncommittedFiles(ROOT_DIR, globalIndex)).toBe(false)
			uncommittedFilesMock.mockRestore()

			expect(instance.uncommittedFiles).toEqual([])
			expect(instance.loadedFilePaths).toEqual([])
		})

		test('loads files that were uncommitted and included in the global index but not loaded yet', () => {
			const uncommittedFilesMock = jest
				.spyOn(GitHelper, 'uncommittedFiles')
				.mockImplementation(() => [SCRIPT_01_PATH])
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			moduleIndex.getFilePathIndex(
				'upsert',
				ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()
			)
			const instance = new ExternalResourceHelper(ROOT_DIR)
			expect(instance.trackUncommittedFiles(ROOT_DIR, globalIndex)).toBe(true)
			uncommittedFilesMock.mockRestore()

			expect(instance.uncommittedFiles).toEqual([
				ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()
			])
			expect(
				instance.fileInfoFromPath(
					ROOT_DIR.pathTo(SCRIPT_01_PATH),
					SCRIPT_01_PATH
				)
			).toEqual({
				sourceCode: inspector.SCRIPT_SOURCES['1'],
				cucc: true
			})
		})
	})

	describe('deserialization', () => {
		test('empty uncommittedFiles', () => {
			const instance = new ExternalResourceHelper(ROOT_DIR)
			const json = instance.toJSON()
			const newInstance = ExternalResourceHelper.fromJSON(ROOT_DIR, json)

			expect(instance.uncommittedFiles).toBe(undefined)
			expect(newInstance.uncommittedFiles).toEqual([])

			expect(newInstance.toJSON()).toEqual(json)
		})
	})

	describe('inspector session connection', () => {
		test('connected inspector session', async () => {
			const instance = new ExternalResourceHelper(ROOT_DIR)

			const fileInfoFromScriptIDSpy = jest.spyOn(
				instance,
				'fileInfoFromScriptID'
			)
			await instance.connect()
			await instance.listen()

			expect(fileInfoFromScriptIDSpy).toHaveBeenCalledTimes(3)
			expect(fileInfoFromScriptIDSpy).toHaveBeenNthCalledWith(1, '1')
			expect(fileInfoFromScriptIDSpy).toHaveBeenNthCalledWith(2, '2')
			expect(fileInfoFromScriptIDSpy).toHaveBeenNthCalledWith(3, '3')

			fileInfoFromScriptIDSpy.mockRestore()
		})
	})

	test('fillSourceMapsFromCPUProfile', async () => {
		const profile: ICpuProfileRaw = {
			nodes: [
				{
					id: 1,
					callFrame: {
						functionName: 'foo',
						url: SCRIPT_01_PATH.toString(),
						scriptId: '1',
						lineNumber: 1,
						columnNumber: 1
					},
					hitCount: 1,
					children: [2]
				},
				{
					id: 2,
					callFrame: {
						functionName: 'bar',
						url: SCRIPT_02_PATH.toString(),
						scriptId: '2',
						lineNumber: 2,
						columnNumber: 2
					},
					hitCount: 1,
					children: [3]
				},
				{
					id: 3,
					callFrame: {
						functionName: 'baz',
						url: SCRIPT_03_PATH.toString(),
						scriptId: '3',
						lineNumber: 3,
						columnNumber: 3
					},
					hitCount: 1,
					children: []
				}
			],
			samples: [1, 2, 3],
			timeDeltas: [10, 20, 30],
			startTime: 0,
			endTime: 100
		}

		const instance = new ExternalResourceHelper(ROOT_DIR)
		instance.connect()

		await instance.fillSourceMapsFromCPUProfile(profile)

		expect(instance.scriptIDs).toEqual(['1', '2', '3'])

		expect(
			(
				await instance.sourceMapFromScriptID(
					'1' as ScriptID_string,
					SCRIPT_01_PATH
				)
			)?.toJSON()
		).toEqual({
			file: 'script01.js',
			mappings: ';AAAA,OAAO,CAAC,GAAG,CAAC,eAAe,CAAC,CAAA',
			names: [],
			sources: ['../../examples/script01.ts'],
			sourceRoot: '',
			version: 3
		})

		expect(
			(
				await instance.sourceMapFromScriptID(
					'2' as ScriptID_string,
					SCRIPT_02_PATH
				)
			)?.toJSON()
		).toEqual({
			file: 'script02.js',
			mappings:
				';AAAA,KAAK,IAAI,CAAC,GAAG,CAAC,EAAE,CAAC,GAAG,CAAC,EAAE,CAAC,EAAE,EAAE,CAAC;IAC5B,OAAO,CAAC,GAAG,CAAC,eAAe,CAAC,CAAA;AAC7B,CAAC',
			names: [],
			sources: ['../../examples/script02.ts'],
			sourceRoot: '',
			version: 3
		})

		expect(
			(
				await instance.sourceMapFromScriptID(
					'3' as ScriptID_string,
					SCRIPT_03_PATH
				)
			)?.toJSON()
		).toEqual({
			file: 'script03.js',
			mappings:
				';;AAAA,SAAwB,GAAG,CAAC,CAAS;IACpC,IAAI,CAAC,IAAI,CAAC,EAAE,CAAC;QACZ,OAAO,CAAC,CAAA;IACT,CAAC;IACD,OAAO,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,CAAA;AAC/B,CAAC;AALD,sBAKC',
			names: [],
			sources: ['../../examples/script03.ts'],
			sourceRoot: '',
			version: 3
		})
	})
})
