import * as fs from 'fs'

import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { JestAdapter } from '../../../src/adapters/transformer/JestAdapter'

const CURRENT_DIR = new UnifiedPath(__dirname)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global

describe('JestAdapter', () => {
	let instance: JestAdapter

	beforeEach(() => {
		instance = new JestAdapter(
			globalAny.jestConfig,globalAny.jestContext
		)
	})

	it('instance should be an instanceof JestAdapter', () => {
		expect(instance instanceof JestAdapter).toBeTruthy()
	})

	it('should have a method config()', async () => {
		expect(instance.config).toBeTruthy()
	})

	it('should have a method context()', async () => {
		expect(instance.context).toBeTruthy()
	})

	it('should have a method transformer()', async () => {
		expect(instance.transformer).toBeTruthy()
	})

	it('should have a method process()', async () => {
		expect(instance.process).toBeTruthy()
	})

	test('returns correct config', async () => {
		expect(await instance.config()).toBe(globalAny.jestConfig)
	})

	test('returns correct context', async () => {
		expect(await instance.context()).toBe(globalAny.jestContext)
	})

	test('throw error if a the file should not be transformed', async () => {
		const testFilePath = CURRENT_DIR.join('node_modules', 'inheritance.json')

		expect(instance.process(testFilePath)).rejects.toThrowError(
			'JestAdapter.process: Jest does not transform the file: ' + testFilePath.toPlatformString()
		)
	})

	test('test case 1', async () => {
		const testFilePath = new UnifiedPath(process.cwd()).pathTo(CURRENT_DIR.join('assets', 'inheritance.test.ts'))
		const expectedFilePath = CURRENT_DIR.join('assets', 'inheritance.test.jest.js')

		const transformedSourceCode = (await instance.process(
			testFilePath
		)).replace(/^\/\/#.*?$/gm, '')

		const expectedSourceCode = fs.readFileSync(expectedFilePath.toString()).toString()

		if (!transformedSourceCode) {
			expect(false).toBeTruthy()
		} else {
			expect(transformedSourceCode).toEqual(expectedSourceCode)
		}
	})
})