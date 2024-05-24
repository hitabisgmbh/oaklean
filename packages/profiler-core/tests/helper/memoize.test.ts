import { memoize } from '../../src/helper/memoize'

describe('memoize', () => {
	it('should expose a function', () => {
		expect(memoize).toBeDefined()
	})
	
	it('memoize should return expected output', () => {
		let a = 0
		function test() {
			a += 1
			return a
		}

		expect(test()).toBe(1)
		expect(test()).toBe(2)
		expect(test()).toBe(3)

		a = 0
		const memoizedTest = memoize(test)
		expect(memoizedTest()).toBe(1)
		expect(memoizedTest()).toBe(1)
		expect(memoizedTest()).toBe(1)
	})
})