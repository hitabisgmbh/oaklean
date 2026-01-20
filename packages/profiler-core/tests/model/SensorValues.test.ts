import { MilliJoule_number } from '../../src'
import {
	SENSOR_VALUES_BYTE_SIZE_MAP,
	SensorValues
} from '../../src/model/SensorValues'
import { ISensorValues, MicroSeconds_number } from '../../src/types'

const EXAMPLE_SENSOR_VALUES: ISensorValues = {
	profilerHits: 1,

	// CPU Time
	selfCPUTime: 1 as MicroSeconds_number,
	internCPUTime: 2 as MicroSeconds_number,
	externCPUTime: 3 as MicroSeconds_number,
	langInternalCPUTime: 4 as MicroSeconds_number,
	aggregatedCPUTime: 10 as MicroSeconds_number,

	// CPU Energy Consumption
	selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
	internCPUEnergyConsumption: 0.02 as MilliJoule_number,
	externCPUEnergyConsumption: 0.03 as MilliJoule_number,
	langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number,
	aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,

	// RAM Energy Consumption
	selfRAMEnergyConsumption: 0.05 as MilliJoule_number,
	internRAMEnergyConsumption: 0.06 as MilliJoule_number,
	externRAMEnergyConsumption: 0.07 as MilliJoule_number,
	langInternalRAMEnergyConsumption: 0.08 as MilliJoule_number,
	aggregatedRAMEnergyConsumption: 0.26 as MilliJoule_number
}

const EXAMPLE_SENSOR_VALUES_BUFFER =
	'ffff01000000010000000a0000000200000003000000040000007b14ae47e17a843f9a9999999999b93f7b14ae47e17a943fb81e85eb51b89e3f7b14ae47e17aa43f9a9999999999a93fa4703d0ad7a3d03fb81e85eb51b8ae3fec51b81e85ebb13f01007b14ae47e17ab43f'

// Round to n decimal places
function roundSensorValues(
	sensorValues: ISensorValues | SensorValues,
	precision: number
) {
	for (const sensorValueName of Object.keys(SENSOR_VALUES_BYTE_SIZE_MAP)) {
		const value = sensorValues[sensorValueName as keyof ISensorValues]
		if (value !== undefined) {
			sensorValues[sensorValueName as keyof ISensorValues] = parseFloat(
				value.toFixed(precision)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			) as any
		}
	}
}

function testAllSensorValuesArePresent(
	sensorValues: ISensorValues | SensorValues
) {
	for (const sensorValueName of Object.keys(SENSOR_VALUES_BYTE_SIZE_MAP)) {
		const value = sensorValues[sensorValueName as keyof ISensorValues]
		expect(value !== undefined && value > 0).toBe(true)
	}
}

function runInstanceTests(
	title: string,
	preDefinedInstance: () => SensorValues
) {
	describe(title, () => {
		let instance: SensorValues
		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof SensorValues', () => {
			expect(instance instanceof SensorValues).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SensorValues.fromJSON).toBeTruthy()
		})

		it('should serialize correctly', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toBe(
				EXAMPLE_SENSOR_VALUES_BUFFER
			)
		})

		test('clone', () => {
			const clone = instance.clone()
			expect(clone.toJSON()).toEqual(instance.toJSON())
		})

		test('cloneAsIsolated', () => {
			const clone = instance.cloneAsIsolated()
			expect(clone.toJSON()).toEqual({
				profilerHits: instance.profilerHits,
				selfCPUTime: instance.selfCPUTime,
				aggregatedCPUTime: instance.selfCPUTime,
				selfCPUEnergyConsumption: instance.selfCPUEnergyConsumption,
				aggregatedCPUEnergyConsumption: instance.selfCPUEnergyConsumption,
				selfRAMEnergyConsumption: instance.selfRAMEnergyConsumption,
				aggregatedRAMEnergyConsumption: instance.selfRAMEnergyConsumption
			} satisfies ISensorValues)
		})

		test('cloneAsAggregated', () => {
			const clone = instance.cloneAsAggregated()
			expect(clone.toJSON()).toEqual({
				aggregatedCPUTime: instance.aggregatedCPUTime,
				aggregatedCPUEnergyConsumption: instance.aggregatedCPUEnergyConsumption,
				aggregatedRAMEnergyConsumption: instance.aggregatedRAMEnergyConsumption
			} satisfies ISensorValues)
		})
	})
}

describe('SensorValues', () => {
	runInstanceTests('instance related', () => {
		return new SensorValues({
			profilerHits: 1,

			// CPU Time
			selfCPUTime: 1 as MicroSeconds_number,
			internCPUTime: 2 as MicroSeconds_number,
			externCPUTime: 3 as MicroSeconds_number,
			langInternalCPUTime: 4 as MicroSeconds_number,
			aggregatedCPUTime: 10 as MicroSeconds_number,

			// CPU Energy Consumption
			selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
			internCPUEnergyConsumption: 0.02 as MilliJoule_number,
			externCPUEnergyConsumption: 0.03 as MilliJoule_number,
			langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number,
			aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,

			// RAM Energy Consumption
			selfRAMEnergyConsumption: 0.05 as MilliJoule_number,
			internRAMEnergyConsumption: 0.06 as MilliJoule_number,
			externRAMEnergyConsumption: 0.07 as MilliJoule_number,
			langInternalRAMEnergyConsumption: 0.08 as MilliJoule_number,
			aggregatedRAMEnergyConsumption: 0.26 as MilliJoule_number
		})
	})

	test('all default values are present', () => {
		testAllSensorValuesArePresent(EXAMPLE_SENSOR_VALUES)
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = SensorValues.fromJSON(
				JSON.stringify(EXAMPLE_SENSOR_VALUES)
			)
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
		})

		test('deserialization from object', () => {
			const instanceFromObject = SensorValues.fromJSON(EXAMPLE_SENSOR_VALUES)
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromString = SensorValues.fromJSON(
				JSON.stringify(EXAMPLE_SENSOR_VALUES)
			)
			return instanceFromString
		})
	})

	describe('toBuffer with zero values', () => {
		test('example 01', () => {
			const example = new SensorValues({})
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe('0000')
			const { instance, remainingBuffer } =
				SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})

		test('example 02', () => {
			const example = new SensorValues({
				profilerHits: 1 as MicroSeconds_number,
				selfCPUTime: 0 as MicroSeconds_number,
				aggregatedCPUTime: 3 as MicroSeconds_number,
				internCPUTime: 0 as MicroSeconds_number,
				externCPUTime: 4 as MicroSeconds_number,
				langInternalCPUTime: 0 as MicroSeconds_number,
				selfCPUEnergyConsumption: 0 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.2 as MilliJoule_number,
				internCPUEnergyConsumption: 0 as MilliJoule_number,
				externCPUEnergyConsumption: 0.2 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0 as MilliJoule_number
			})
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe(
				'95020100000003000000040000009a9999999999c93f9a9999999999c93f'
			)
			const { instance, remainingBuffer } =
				SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})
		test('example 02', () => {
			const example = new SensorValues({
				selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,
				internCPUEnergyConsumption: 0.02 as MilliJoule_number,
				externCPUEnergyConsumption: 0.03 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number
			})
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe(
				'c0077b14ae47e17a843f9a9999999999b93f7b14ae47e17a943fb81e85eb51b89e3f7b14ae47e17aa43f'
			)
			const { instance, remainingBuffer } =
				SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_SENSOR_VALUES_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } =
				SensorValues.consumeFromBuffer(buffer)
			expect(instance.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = SensorValues.consumeFromBuffer(buffer)
			return instance
		})
	})

	describe('operators', () => {
		let instanceA: SensorValues
		let instanceB: SensorValues
		let instanceC: SensorValues

		beforeEach(() => {
			instanceA = new SensorValues({
				profilerHits: 1,

				// CPU Time
				selfCPUTime: 2 as MicroSeconds_number,
				internCPUTime: 3 as MicroSeconds_number,
				externCPUTime: 4 as MicroSeconds_number,
				langInternalCPUTime: 5 as MicroSeconds_number,
				aggregatedCPUTime: 14 as MicroSeconds_number,

				// CPU Energy Consumption
				selfCPUEnergyConsumption: 0.06 as MilliJoule_number,
				internCPUEnergyConsumption: 0.07 as MilliJoule_number,
				externCPUEnergyConsumption: 0.08 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.09 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.3 as MilliJoule_number,

				// RAM Energy Consumption
				selfRAMEnergyConsumption: 0.1 as MilliJoule_number,
				internRAMEnergyConsumption: 0.11 as MilliJoule_number,
				externRAMEnergyConsumption: 0.12 as MilliJoule_number,
				langInternalRAMEnergyConsumption: 0.13 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 0.46 as MilliJoule_number
			})
			instanceB = new SensorValues({
				profilerHits: 7 as MicroSeconds_number,

				// CPU Time
				selfCPUTime: 8 as MicroSeconds_number,
				internCPUTime: 9 as MicroSeconds_number,
				externCPUTime: 10 as MicroSeconds_number,
				langInternalCPUTime: 11 as MicroSeconds_number,
				aggregatedCPUTime: 38 as MicroSeconds_number,

				// CPU Energy Consumption
				selfCPUEnergyConsumption: 0.12 as MilliJoule_number,
				internCPUEnergyConsumption: 0.13 as MilliJoule_number,
				externCPUEnergyConsumption: 0.14 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.15 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.54 as MilliJoule_number,

				// RAM Energy Consumption
				selfRAMEnergyConsumption: 0.16 as MilliJoule_number,
				internRAMEnergyConsumption: 0.17 as MilliJoule_number,
				externRAMEnergyConsumption: 0.18 as MilliJoule_number,
				langInternalRAMEnergyConsumption: 0.19 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 0.7 as MilliJoule_number
			})
			instanceC = new SensorValues({
				profilerHits: 13 as MicroSeconds_number,

				// CPU Time
				selfCPUTime: 14 as MicroSeconds_number,
				internCPUTime: 15 as MicroSeconds_number,
				externCPUTime: 16 as MicroSeconds_number,
				langInternalCPUTime: 17 as MicroSeconds_number,
				aggregatedCPUTime: 62 as MicroSeconds_number,

				// CPU Energy Consumption
				selfCPUEnergyConsumption: 0.18 as MilliJoule_number,
				internCPUEnergyConsumption: 0.19 as MilliJoule_number,
				externCPUEnergyConsumption: 0.2 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.21 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.78 as MilliJoule_number,

				// RAM Energy Consumption
				selfRAMEnergyConsumption: 0.22 as MilliJoule_number,
				internRAMEnergyConsumption: 0.23 as MilliJoule_number,
				externRAMEnergyConsumption: 0.24 as MilliJoule_number,
				langInternalRAMEnergyConsumption: 0.25 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 0.94 as MilliJoule_number
			})
		})

		test('all default values are present', () => {
			for (const sensorValues of [instanceA, instanceB, instanceC]) {
				testAllSensorValuesArePresent(sensorValues)
			}
		})

		test('max', () => {
			const max = SensorValues.max(instanceA, instanceB, instanceC)

			expect(max.toJSON()).toEqual({
				profilerHits: 13 as MicroSeconds_number,

				// CPU Time
				selfCPUTime: 14 as MicroSeconds_number,
				internCPUTime: 15 as MicroSeconds_number,
				externCPUTime: 16 as MicroSeconds_number,
				langInternalCPUTime: 17 as MicroSeconds_number,
				aggregatedCPUTime: 62 as MicroSeconds_number,

				// CPU Energy Consumption
				selfCPUEnergyConsumption: 0.18 as MilliJoule_number,
				internCPUEnergyConsumption: 0.19 as MilliJoule_number,
				externCPUEnergyConsumption: 0.2 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.21 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.78 as MilliJoule_number,

				// RAM Energy Consumption
				selfRAMEnergyConsumption: 0.22 as MilliJoule_number,
				internRAMEnergyConsumption: 0.23 as MilliJoule_number,
				externRAMEnergyConsumption: 0.24 as MilliJoule_number,
				langInternalRAMEnergyConsumption: 0.25 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 0.94 as MilliJoule_number
			})

			// test with empty instance
			expect(
				SensorValues.max(
					new SensorValues({}),
					new SensorValues({}),
					new SensorValues({})
				).toJSON()
			).toEqual(new SensorValues({}).toJSON())
		})

		test('sum', () => {
			const sum = SensorValues.sum(instanceA, instanceB, instanceC)

			// Round to 2 decimal places since the values are floats and the sum might not be exact
			roundSensorValues(sum, 2)

			expect(sum.toJSON()).toEqual({
				profilerHits: 21 as MicroSeconds_number,

				// CPU Time
				selfCPUTime: 24 as MicroSeconds_number,
				internCPUTime: 27 as MicroSeconds_number,
				externCPUTime: 30 as MicroSeconds_number,
				langInternalCPUTime: 33 as MicroSeconds_number,
				aggregatedCPUTime: 114 as MicroSeconds_number,

				// CPU Energy Consumption
				selfCPUEnergyConsumption: 0.36 as MilliJoule_number,
				internCPUEnergyConsumption: 0.39 as MilliJoule_number,
				externCPUEnergyConsumption: 0.42 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.45 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 1.62 as MilliJoule_number,

				// RAM Energy Consumption
				selfRAMEnergyConsumption: 0.48 as MilliJoule_number,
				internRAMEnergyConsumption: 0.51 as MilliJoule_number,
				externRAMEnergyConsumption: 0.54 as MilliJoule_number,
				langInternalRAMEnergyConsumption: 0.57 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 2.1 as MilliJoule_number
			})

			// test with empty instance
			expect(
				SensorValues.sum(
					new SensorValues({}),
					new SensorValues({}),
					new SensorValues({})
				).toJSON()
			).toEqual(new SensorValues({}).toJSON())
		})

		test('equal', () => {
			expect(SensorValues.equals(instanceA, instanceB)).toBe(false)
			expect(SensorValues.equals(instanceA, instanceC)).toBe(false)
			expect(SensorValues.equals(instanceB, instanceC)).toBe(false)

			expect(SensorValues.equals(instanceA, instanceA)).toBe(true)
			expect(SensorValues.equals(instanceB, instanceB)).toBe(true)
			expect(SensorValues.equals(instanceC, instanceC)).toBe(true)

			// test with empty instance
			expect(
				SensorValues.equals(new SensorValues({}), new SensorValues({}))
			).toBe(true)
		})

		describe('addToSelf', () => {
			test('test with non empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToSelf(instanceB)

				const expected = instanceA.clone()
				expected.selfCPUTime = (expected.selfCPUTime +
					instanceB.selfCPUTime) as MicroSeconds_number
				expected.selfCPUEnergyConsumption = (expected.selfCPUEnergyConsumption +
					instanceB.selfCPUEnergyConsumption) as MilliJoule_number
				expected.selfRAMEnergyConsumption = (expected.selfRAMEnergyConsumption +
					instanceB.selfRAMEnergyConsumption) as MilliJoule_number

				expect(result.toJSON()).toEqual(expected.toJSON())
			})

			test('test with empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToSelf(new SensorValues({}))

				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToSelf({})
				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with non empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToSelf(EXAMPLE_SENSOR_VALUES)
				const expected = instanceA.clone()
				expected.selfCPUTime = (expected.selfCPUTime + 1) as MicroSeconds_number
				expected.selfCPUEnergyConsumption = (expected.selfCPUEnergyConsumption +
					0.01) as MilliJoule_number
				expected.selfRAMEnergyConsumption = (expected.selfRAMEnergyConsumption +
					0.05) as MilliJoule_number

				expect(expected.toJSON()).toEqual(result.toJSON())
			})
		})

		describe('addToAggregated', () => {
			test('test with non empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToAggregated(instanceB)

				const expected = instanceA.clone()
				expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
					instanceB.aggregatedCPUTime) as MicroSeconds_number
				expected.aggregatedCPUEnergyConsumption =
					(expected.aggregatedCPUEnergyConsumption +
						instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
				expected.aggregatedRAMEnergyConsumption =
					(expected.aggregatedRAMEnergyConsumption +
						instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

				expect(result.toJSON()).toEqual(expected.toJSON())
			})

			test('test with empty SensorValues', () => {
				const result2 = instanceA.clone()
				result2.addToAggregated(new SensorValues({}))

				expect(instanceA.toJSON()).toEqual(result2.toJSON())
			})

			test('test with empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToAggregated({})
				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with non empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToAggregated(EXAMPLE_SENSOR_VALUES)
				const expected = instanceA.clone()
				expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
					10) as MicroSeconds_number
				expected.aggregatedCPUEnergyConsumption =
					(expected.aggregatedCPUEnergyConsumption + 0.1) as MilliJoule_number
				expected.aggregatedRAMEnergyConsumption =
					(expected.aggregatedRAMEnergyConsumption + 0.26) as MilliJoule_number

				expect(expected.toJSON()).toEqual(result.toJSON())
			})
		})

		describe('addToIntern', () => {
			test('test with non empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToIntern(instanceB)

				const expected = instanceA.clone()
				expected.internCPUTime = (expected.internCPUTime +
					instanceB.aggregatedCPUTime) as MicroSeconds_number
				expected.internCPUEnergyConsumption =
					(expected.internCPUEnergyConsumption +
						instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
				expected.internRAMEnergyConsumption =
					(expected.internRAMEnergyConsumption +
						instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

				expect(result.toJSON()).toEqual(expected.toJSON())
			})

			test('test with empty SensorValues', () => {
				const result2 = instanceA.clone()
				result2.addToIntern(new SensorValues({}))

				expect(instanceA.toJSON()).toEqual(result2.toJSON())
			})

			test('test with empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToIntern({})
				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with non empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToIntern(EXAMPLE_SENSOR_VALUES)
				const expected = instanceA.clone()
				expected.internCPUTime = (expected.internCPUTime +
					10) as MicroSeconds_number
				expected.internCPUEnergyConsumption =
					(expected.internCPUEnergyConsumption + 0.1) as MilliJoule_number
				expected.internRAMEnergyConsumption =
					(expected.internRAMEnergyConsumption + 0.26) as MilliJoule_number

				expect(expected.toJSON()).toEqual(result.toJSON())
			})
		})

		describe('addToExtern', () => {
			test('with non empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToExtern(instanceB)

				const expected = instanceA.clone()
				expected.externCPUTime = (expected.externCPUTime +
					instanceB.aggregatedCPUTime) as MicroSeconds_number
				expected.externCPUEnergyConsumption =
					(expected.externCPUEnergyConsumption +
						instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
				expected.externRAMEnergyConsumption =
					(expected.externRAMEnergyConsumption +
						instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

				expect(result.toJSON()).toEqual(expected.toJSON())
			})

			test('with empty SensorValues', () => {
				const result2 = instanceA.clone()
				result2.addToExtern(new SensorValues({}))

				expect(instanceA.toJSON()).toEqual(result2.toJSON())
			})

			test('test with empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToExtern({})
				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with non empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToExtern(EXAMPLE_SENSOR_VALUES)
				const expected = instanceA.clone()
				expected.externCPUTime = (expected.externCPUTime +
					10) as MicroSeconds_number
				expected.externCPUEnergyConsumption =
					(expected.externCPUEnergyConsumption + 0.1) as MilliJoule_number
				expected.externRAMEnergyConsumption =
					(expected.externRAMEnergyConsumption + 0.26) as MilliJoule_number

				expect(expected.toJSON()).toEqual(result.toJSON())
			})
		})

		describe('addToLangInternal', () => {
			test('with non empty SensorValues', () => {
				const result = instanceA.clone()
				result.addToLangInternal(instanceB)

				const expected = instanceA.clone()
				expected.langInternalCPUTime = (expected.langInternalCPUTime +
					instanceB.aggregatedCPUTime) as MicroSeconds_number
				expected.langInternalCPUEnergyConsumption =
					(expected.langInternalCPUEnergyConsumption +
						instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
				expected.langInternalRAMEnergyConsumption =
					(expected.langInternalRAMEnergyConsumption +
						instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

				expect(result.toJSON()).toEqual(expected.toJSON())
			})

			test('with empty SensorValues', () => {
				const result2 = instanceA.clone()
				result2.addToLangInternal(new SensorValues({}))

				expect(instanceA.toJSON()).toEqual(result2.toJSON())
			})

			test('test with empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToLangInternal({})
				expect(instanceA.toJSON()).toEqual(result.toJSON())
			})

			test('test with non empty Partial<ISensorValues>', () => {
				const result = instanceA.clone()
				result.addToLangInternal(EXAMPLE_SENSOR_VALUES)
				const expected = instanceA.clone()
				expected.langInternalCPUTime = (expected.langInternalCPUTime +
					10) as MicroSeconds_number
				expected.langInternalCPUEnergyConsumption =
					(expected.langInternalCPUEnergyConsumption + 0.1) as MilliJoule_number
				expected.langInternalRAMEnergyConsumption =
					(expected.langInternalRAMEnergyConsumption +
						0.26) as MilliJoule_number

				expect(expected.toJSON()).toEqual(result.toJSON())
			})
		})

		describe('add', () => {
			describe('intern values', () => {
				let expected: SensorValues

				beforeEach(() => {
					expected = instanceA.clone()
				})
				test('with non empty SensorValues', () => {
					const result = instanceA.add({
						internSensorValues: instanceB
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.internCPUTime = (expected.internCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.internCPUEnergyConsumption =
						(expected.internCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.internRAMEnergyConsumption =
						(expected.internRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})

				test('with empty SensorValues', () => {
					const result = instanceA.clone()
					result.add({
						internSensorValues: new SensorValues({})
					})

					expect(instanceA.toJSON()).toEqual(result.toJSON())
				})

				test('with empty Partial<ISensorValues>', () => {
					const result = instanceA.clone()
					result.add({
						internSensorValues: {}
					})

					expect(instanceA.toJSON()).toEqual(result.toJSON())
				})

				test('with non empty Partial<ISensorValues>', () => {
					const result = instanceA.add({
						internSensorValues: instanceB.toJSON()
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.internCPUTime = (expected.internCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.internCPUEnergyConsumption =
						(expected.internCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.internRAMEnergyConsumption =
						(expected.internRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})
			})

			describe('extern values', () => {
				let expected: SensorValues

				beforeEach(() => {
					expected = instanceA.clone()
				})
				test('with non empty SensorValues', () => {
					const result = instanceA.add({
						externSensorValues: instanceB
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.externCPUTime = (expected.externCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.externCPUEnergyConsumption =
						(expected.externCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.externRAMEnergyConsumption =
						(expected.externRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})

				test('with empty SensorValues', () => {
					const result2 = instanceA.clone()
					result2.add({
						externSensorValues: new SensorValues({})
					})

					expect(instanceA.toJSON()).toEqual(result2.toJSON())
				})

				test('with empty Partial<ISensorValues>', () => {
					const result2 = instanceA.clone()
					result2.add({
						externSensorValues: {}
					})

					expect(instanceA.toJSON()).toEqual(result2.toJSON())
				})

				test('with non empty Partial<ISensorValues>', () => {
					const result = instanceA.add({
						externSensorValues: instanceB.toJSON()
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.externCPUTime = (expected.externCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.externCPUEnergyConsumption =
						(expected.externCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.externRAMEnergyConsumption =
						(expected.externRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})
			})

			describe('langInternal values', () => {
				let expected: SensorValues

				beforeEach(() => {
					expected = instanceA.clone()
				})

				test('with non empty SensorValues', () => {
					const result = instanceA.add({
						langInternalSensorValues: instanceB
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.langInternalCPUTime = (expected.langInternalCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.langInternalCPUEnergyConsumption =
						(expected.langInternalCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.langInternalRAMEnergyConsumption =
						(expected.langInternalRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})

				test('with empty SensorValues', () => {
					const result = instanceA.clone()
					result.add({
						langInternalSensorValues: new SensorValues({})
					})

					expect(instanceA.toJSON()).toEqual(result.toJSON())
				})

				test('with empty Partial<ISensorValues>', () => {
					const result = instanceA.clone()
					result.add({
						langInternalSensorValues: {}
					})

					expect(instanceA.toJSON()).toEqual(result.toJSON())
				})

				test('with non empty Partial<ISensorValues>', () => {
					const result = instanceA.add({
						langInternalSensorValues: instanceB.toJSON()
					})
					expected.aggregatedCPUTime = (expected.aggregatedCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.aggregatedCPUEnergyConsumption =
						(expected.aggregatedCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.aggregatedRAMEnergyConsumption =
						(expected.aggregatedRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					expected.langInternalCPUTime = (expected.langInternalCPUTime +
						instanceB.aggregatedCPUTime) as MicroSeconds_number
					expected.langInternalCPUEnergyConsumption =
						(expected.langInternalCPUEnergyConsumption +
							instanceB.aggregatedCPUEnergyConsumption) as MilliJoule_number
					expected.langInternalRAMEnergyConsumption =
						(expected.langInternalRAMEnergyConsumption +
							instanceB.aggregatedRAMEnergyConsumption) as MilliJoule_number

					// Round to 2 decimal places since the values are floats and the sum might not be exact
					roundSensorValues(result, 2)
					roundSensorValues(expected, 2)

					expect(result.toJSON()).toEqual(expected.toJSON())
				})
			})
		})
	})
})
