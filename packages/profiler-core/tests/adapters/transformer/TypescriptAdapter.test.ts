import * as fs from 'fs'

import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { TypeScriptAdapter } from '../../../src/adapters/transformer/TypeScriptAdapter'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('TypeScriptAdapter', () => {
	let instance: TypeScriptAdapter

	beforeEach(() => {
		instance = new TypeScriptAdapter()
	})

	it('instance should be an instanceof TypeScriptAdapter', () => {
		expect(instance instanceof TypeScriptAdapter).toBeTruthy()
	})

	it('should have a method process()', async () => {
		expect(instance.process).toBeTruthy()
	})
	test('test case 1', async () => {
		const testFilePath = new UnifiedPath(process.cwd()).pathTo(CURRENT_DIR.join('assets', 'inheritance.test.ts'))
		const expectedFilePath = CURRENT_DIR.join('assets', 'inheritance.test.typescript.js')

		const transformedSourceCode = (await instance.process(
			testFilePath
		)).replace(/^\/\/#.*$/gm, '')

		const expectedSourceCode = fs.readFileSync(expectedFilePath.toString()).toString()
 
		if (!transformedSourceCode) {
			expect(false).toBeTruthy()
		} else {
			expect(transformedSourceCode).toEqual(expectedSourceCode)
		}
	})
})