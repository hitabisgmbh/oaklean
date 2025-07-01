import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

/*
	This file contains cases that were previously identified as duplicates
*/

function duplicatesExist(code: string, scriptKind: 'TS' | 'TSX' = 'TS') {
	let hasDuplicates = false

	const pst = TypescriptParser.parseSource(
		new UnifiedPath(''),
		code,
		scriptKind,
		(filePath, node, identifier: string, loc, duplicateLoc) => {
			hasDuplicates = true
		}
	)
	return {
		pst,
		hasDuplicates
	}
}

test('static method', () => {
	const code = `
		class A {
			method() {}
			static method() {}
		}
	`
	const result = duplicatesExist(code)
	expect(result.hasDuplicates).toBe(false)
	expect(result.pst.numberOfLeafs()).toBe(2)
})

test('object method', () => {
	const code = `
		const x = {
			a() {}
		}
		const y = {
			a() {}
		}
	`
	const result = duplicatesExist(code)
	expect(result.hasDuplicates).toBe(false)
	expect(result.pst.numberOfLeafs()).toBe(2)
})

describe('defined within if case', () => {
	test('one case', () => {
		const code = `
		if(Date.now() % 2 === 0) {
			const func = () => {}
		}
		const func = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('two cases', () => {
		const code = `
		if(Date.now() % 2 === 0) {
			function a() {}
		} else {
			function a() {}
		}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('else if cases', () => {
		const code = `
		if(Date.now() % 2 === 0) {
			function a() {}
		} else if(Date.now() % 2 === 1){
			function a() {}
		}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})
})
