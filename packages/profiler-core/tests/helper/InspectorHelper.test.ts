import * as inspector from '../__mocks__/inspector.mock'
import { InspectorHelper } from '../../src/helper/InspectorHelper'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { PermissionHelper } from '../../src'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import { SourceMap } from '../../src/model/SourceMap'
// Types
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'

const ROOT_DIR = new UnifiedPath(__dirname).join('..', '..', '..', '..')

const SCRIPT_01_PATH = ROOT_DIR.join('packages/profiler-core/tests/__mocks__/script01.js')
const SCRIPT_02_PATH = ROOT_DIR.join('packages/profiler-core/tests/__mocks__/script02.js')
const SCRIPT_03_PATH = ROOT_DIR.join('packages/profiler-core/tests/__mocks__/script03.js')

describe('InspectorHelper', () => {
	describe('instance related', () => {
		let instance: InspectorHelper

		beforeEach(async () => {
			instance = new InspectorHelper()
			await instance.connect()
			await instance.listen()

			

			instance.parseFile(
				ROOT_DIR.pathTo(SCRIPT_01_PATH),
				SCRIPT_01_PATH
			)

			instance.parseFile(
				ROOT_DIR.pathTo(SCRIPT_02_PATH),
				SCRIPT_02_PATH
			)

			instance.parseFile(
				ROOT_DIR.pathTo(SCRIPT_03_PATH),
				SCRIPT_03_PATH
			)
		})

		it('instance should be an instanceof ProjectReport', () => {
			expect(instance instanceof InspectorHelper).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(InspectorHelper.fromJSON).toBeTruthy()
		})

		it('should have a method connect()', () => {
			expect(instance.connect).toBeTruthy()
		})

		it('should have a method storeToFile()', () => {
			expect(instance.storeToFile).toBeTruthy()
		})

		it('should have a static method loadFromFile()', () => {
			expect(InspectorHelper.loadFromFile).toBeTruthy()
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

		it('should have a method loadFile()', () => {
			expect(instance.loadFile).toBeTruthy()
		})

		it('should have a method parseFile()', () => {
			expect(instance.parseFile).toBeTruthy()
		})

		it('should have a method sourceCodeFromId()', () => {
			expect(instance.sourceCodeFromId).toBeTruthy()
		})

		it('should have a method sourceMapFromId()', () => {
			expect(instance.sourceMapFromId).toBeTruthy()
		})

		test('toJSON()', () => {
			expect(instance.toJSON()).toEqual({
				sourceCodeMap: inspector.SCRIPT_SOURCES,
				loadedFiles: {
					[ROOT_DIR.pathTo(SCRIPT_01_PATH).toString()]: inspector.SCRIPT_SOURCES['1'],
					[ROOT_DIR.pathTo(SCRIPT_02_PATH).toString()]: inspector.SCRIPT_SOURCES['2'],
					[ROOT_DIR.pathTo(SCRIPT_03_PATH).toString()]: inspector.SCRIPT_SOURCES['3']
				}
			})
		})

		test('fromJSON()', () => {
			const json = instance.toJSON()
			const newInstance = InspectorHelper.fromJSON(json)

			expect(newInstance.toJSON()).toEqual(json)
		})

		test('storeToFile()', async () => {
			const writeFileWithUserPermissionSpy = jest.spyOn(PermissionHelper, 'writeFileWithUserPermission').mockImplementation(() => undefined)
			const filePath = new UnifiedPath(__dirname + '/inspectorHelper.json')
			
			await instance.storeToFile(filePath, 'json')

			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledTimes(1)
			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledWith(
				filePath.toPlatformString(),
				JSON.stringify(instance)
			)

			await instance.storeToFile(filePath, 'pretty-json')

			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledTimes(2)
			expect(writeFileWithUserPermissionSpy).toHaveBeenCalledWith(
				filePath.toPlatformString(),
				JSON.stringify(instance, null, 2)
			)

			writeFileWithUserPermissionSpy.mockRestore()
		})

		test('sourceCodeFromId()', async () => {
			expect(await instance.sourceCodeFromId('0')).toBeNull()
		})

		test('loadFromFile', async () => {
			const filePath = new UnifiedPath(__dirname).join('assets', 'InspectorHelper', 'instance.json')

			if (UPDATE_TEST_REPORTS) {
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					JSON.stringify(instance)
				)
			}

			const loadedInstance = InspectorHelper.loadFromFile(filePath)
			expect(loadedInstance).toBeDefined()
			if (loadedInstance) {
				expect(loadedInstance.toJSON()).toEqual(instance.toJSON())
			}
		})

		test('sourceMapFromId()', async () => {
			expect(await instance.sourceMapFromId(
				SCRIPT_01_PATH,
				'0'
			)).toBeNull()

			expect((await instance.sourceMapFromId(
				SCRIPT_01_PATH,
				'1'
			))?.toJSON()).toEqual(SourceMap.fromCompiledJSString(
				SCRIPT_01_PATH,
				inspector.SCRIPT_SOURCES['1']
			)?.toJSON())
		})
	})

	describe('debug connection', () => {
		test('not enabled debugger', async () => {
			const instance = new InspectorHelper()

			await expect(async () => {
				await instance.listen()
			}).rejects.toThrow('Session is not connected')
		})

		test('disabled debugger', async () => {
			const instance = new InspectorHelper()

			await instance.connect()
			await instance.disconnect()

			await expect(async () => {
				await instance.listen()
			}).rejects.toThrow('Session is not connected')
		})

		test('enabled debugger', async () => {
			const instance = new InspectorHelper()

			const sourceCodeFromIdSpy = jest.spyOn(instance, 'sourceCodeFromId')
			await instance.connect()
			await instance.listen()

			expect(sourceCodeFromIdSpy).toHaveBeenCalledTimes(3)
			expect(sourceCodeFromIdSpy).toHaveBeenNthCalledWith(1, '1')
			expect(sourceCodeFromIdSpy).toHaveBeenNthCalledWith(2, '2')
			expect(sourceCodeFromIdSpy).toHaveBeenNthCalledWith(3, '3')

			sourceCodeFromIdSpy.mockRestore()
		})
	})

	test('fillSourceMapsFromCPUProfile', async () => {
		const profile: ICpuProfileRaw = {
			nodes: [{
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
			}, {
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
			}, {
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
			}],
			samples: [1, 2, 3],
			timeDeltas: [10, 20, 30],
			startTime: 0,
			endTime: 100
		}

		const instance = new InspectorHelper()
		instance.connect()

		await instance.fillSourceMapsFromCPUProfile(profile)

		expect(instance.toJSON()).toEqual({
			sourceCodeMap: inspector.SCRIPT_SOURCES,
			loadedFiles: {}
		})
	})
})