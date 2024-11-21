import {
	MicroSeconds_number,
	MilliJoule_number
} from '../../src/types'
import { UnitHelper } from '../../src/helper/UnitHelper'

describe('UnitHelper', () => {
	test('setMicroSecondsSign', () => {
		const microSeconds = 1000 as MicroSeconds_number
		const valuePositive1 = UnitHelper.setMicroSecondsSign(microSeconds, 1)
		const valuePositive2 = UnitHelper.setMicroSecondsSign(microSeconds, 0)
		const valuePositive3 = UnitHelper.setMicroSecondsSign(microSeconds, 10)
		expect(valuePositive1).toBe(1000)
		expect(valuePositive2).toBe(1000)
		expect(valuePositive3).toBe(1000)

		const valueNegative1 = UnitHelper.setMicroSecondsSign(microSeconds, -10)
		const valueNegative2 = UnitHelper.setMicroSecondsSign(microSeconds, -1)
		expect(valueNegative1).toBe(-1000)
		expect(valueNegative2).toBe(-1000)
	})

	test('setMilliJouleSign', () => {
		const milliJoules = 1000 as MilliJoule_number
		const valuePositive1 = UnitHelper.setMilliJouleSign(milliJoules, 1)
		const valuePositive2 = UnitHelper.setMilliJouleSign(milliJoules, 0)
		const valuePositive3 = UnitHelper.setMilliJouleSign(milliJoules, 10)
		expect(valuePositive1).toBe(1000)
		expect(valuePositive2).toBe(1000)
		expect(valuePositive3).toBe(1000)

		const valueNegative1 = UnitHelper.setMilliJouleSign(milliJoules, -10)
		const valueNegative2 = UnitHelper.setMilliJouleSign(milliJoules, -1)
		expect(valueNegative1).toBe(-1000)
		expect(valueNegative2).toBe(-1000)
	})

	test('sumMicroSeconds', () => {
		const microSeconds1 = 1000 as MicroSeconds_number
		const microSeconds2 = 2000 as MicroSeconds_number

		// addition
		const value1 = UnitHelper.sumMicroSeconds(microSeconds1, microSeconds2, 1)
		expect(value1).toBe(3000)

		const value2 = UnitHelper.sumMicroSeconds(microSeconds1, undefined, 1)
		expect(value2).toBe(1000)

		const value3 = UnitHelper.sumMicroSeconds(undefined, microSeconds2, 1)
		expect(value3).toBe(2000)

		const value4 = UnitHelper.sumMicroSeconds(undefined, undefined, 1)
		expect(value4).toBe(0)

		// subtraction
		const value5 = UnitHelper.sumMicroSeconds(microSeconds1, microSeconds2, -1)
		expect(value5).toBe(-1000)

		const value6 = UnitHelper.sumMicroSeconds(microSeconds1, undefined, -1)
		expect(value6).toBe(1000)

		const value7 = UnitHelper.sumMicroSeconds(undefined, microSeconds2, -1)
		expect(value7).toBe(-2000)

		const value8 = UnitHelper.sumMicroSeconds(undefined, undefined, -1)
		expect(value8).toBe(0)
	})

	test('sumMilliJoule', () => {
		const milliJoules1 = 1000 as MilliJoule_number
		const milliJoules2 = 2000 as MilliJoule_number

		// addition
		const value1 = UnitHelper.sumMilliJoule(milliJoules1, milliJoules2, 1)
		expect(value1).toBe(3000)

		const value2 = UnitHelper.sumMilliJoule(milliJoules1, undefined, 1)
		expect(value2).toBe(1000)

		const value3 = UnitHelper.sumMilliJoule(undefined, milliJoules2, 1)
		expect(value3).toBe(2000)

		const value4 = UnitHelper.sumMilliJoule(undefined, undefined, 1)
		expect(value4).toBe(0)

		// subtraction
		const value5 = UnitHelper.sumMilliJoule(milliJoules1, milliJoules2, -1)
		expect(value5).toBe(-1000)

		const value6 = UnitHelper.sumMilliJoule(milliJoules1, undefined, -1)
		expect(value6).toBe(1000)

		const value7 = UnitHelper.sumMilliJoule(undefined, milliJoules2, -1)
		expect(value7).toBe(-2000)

		const value8 = UnitHelper.sumMilliJoule(undefined, undefined, -1)
		expect(value8).toBe(0)
	})
})