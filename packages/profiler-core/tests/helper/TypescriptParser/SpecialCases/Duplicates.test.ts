import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'

/*
	This file contains cases that were previously identified as duplicates
*/

export function duplicatesExist(code: string, scriptKind: 'TS' | 'TSX' = 'TS') {
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

test('class expressions', () => {
	const code = `
		const class1 = class {
			constructor() {}
		}

		const class2 = class {
			constructor() {}
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

describe('defined within switch case', () => {
	test('switch cases', () => {
		const code = `
		switch(1) {
			case 1:
				function a() {}
			break;
			default:
				function a() {}
			break;
		}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})
})

describe('defined within block', () => {
	test('block scope', () => {
		const code = `
		{
			const a = () => {}
		}
		const a = () => {}
	`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})
})

describe('module declaration', () => {
	test('module declaration', () => {
		const code = `
		module A {
			const a = () => {}
			export const b = () => {}
		}
		module B {
			const b = () => {}
			export const a = () => {}
		}
		const a = () => {}
		const b = () => {}
	`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(6)
	})

	test('duplicate module declaration', () => {
		const code = `
			module A {
				const a = () => {}
				export const b = () => {}
			}
			module A {
				const b = () => {}
				export const a = () => {}
			}
			const a = () => {}
			const b = () => {}
		`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(6)
	})

	test('duplicate declaration chain', () => {
		const code = `
			module A.B {
				const a = () => {}
				export const b = () => {}
			}
			module A.B {
				const b = () => {}
				export const a = () => {}
			}
			const a = () => {}
			const b = () => {}
		`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(6)
	})

	test('module declaration with nested modules', () => {
		const code = `
		module A.B {
    	const a = () => {}
			export const b = () => {}
		}
		module A {
			module B {
				const b = () => {}
				export const a = () => {}
			}
			const a = () => {}
			export const b = () => {}
		}
		const a = () => {}
		const b = () => {}
	`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(8)
	})

	test('module declaration with nested exported modules', () => {
		const code = `
			module A.B {
				const a = () => {}
				export const b = () => {}
			}
			module A {
				export module B {
					const a = () => {}
					export const b = () => {}
				}
			}
			const a = () => {}
			const b = () => {}
		`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(6)
	})

	test('module declaration with nested mixed modules', () => {
		const code = `
			module A {
				export module B {
					export module C {
						const a = () => {}
						export const b = () => {}
					}
					export module D {
						const a = () => {}
						export const b = () => {}
					}
				}
			}
			module A.B {
				export module C {
						const b = () => {}
						export const a = () => {}
				}
				module D {
					const b = () => {}
					export const a = () => {}
				}
			}
			const a = () => {}
			const b = () => {}
		`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(10)
	})
})

describe('defined within try catch', () => {
	test('try catch', () => {
		const code = `
		try {
			const a = () => {}
		} catch(e) {
			const a = () => {}
		} finally {
			const a = () => {}
		}
		const a = () => {}
	`
		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(4)
	})
})

describe('defined within loop', () => {
	test('for loop', () => {
		const code = `
		for(let i = 0; i < 10; i++) {
			const a = () => {}
		}
		const a = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('for of loop', () => {
		const code = `
		for(const i of [1, 2, 3]) {
			const a = () => {}
		}
		const a = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('for in loop', () => {
		const code = `
		for(const i in [1, 2, 3]) {
			const a = () => {}
		}
		const a = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('while loop', () => {
		const code = `
		while(true) {
			const a = () => {}
		}
		const a = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})

	test('do while loop', () => {
		const code = `
		do {
			const a = () => {}
		} while(true)
		const a = () => {}
	`

		const result = duplicatesExist(code)
		expect(result.hasDuplicates).toBe(false)
		expect(result.pst.numberOfLeafs()).toBe(2)
	})
})