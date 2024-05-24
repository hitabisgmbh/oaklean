import { MilliJoule_number } from '../../src'
import { ISensorValues, SensorValues } from '../../src/model/SensorValues'

const EXAMPLE_SENSOR_VALUES: ISensorValues = {
	profilerHits: 1,
	selfCPUTime: 2,
	aggregatedCPUTime: 3,
	internCPUTime: 4,
	externCPUTime: 5,
	langInternalCPUTime: 6,
	selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
	aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,
	internCPUEnergyConsumption: 0.02 as MilliJoule_number,
	externCPUEnergyConsumption: 0.03 as MilliJoule_number,
	langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number
}

const EXAMPLE_SENSOR_VALUES_BUFFER = 'ff070100000002000000030000000400000005000000060000007b14ae47e17a843f9a9999999999b93f7b14ae47e17a943fb81e85eb51b89e3f7b14ae47e17aa43f'

function runInstanceTests(title: string, preDefinedInstance: () => SensorValues) {
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
			expect(instance.toBuffer().toString('hex')).toBe(EXAMPLE_SENSOR_VALUES_BUFFER)
		})
	})
}

describe('SensorValues', () => {
	runInstanceTests('instance related', () => {
		return new SensorValues(
			{
				profilerHits: 1,
				selfCPUTime: 2,
				aggregatedCPUTime: 3,
				internCPUTime: 4,
				externCPUTime: 5,
				langInternalCPUTime: 6,
				selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,
				internCPUEnergyConsumption: 0.02 as MilliJoule_number,
				externCPUEnergyConsumption: 0.03 as MilliJoule_number,
				langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number
			}
		)
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = SensorValues.fromJSON(JSON.stringify(EXAMPLE_SENSOR_VALUES))
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
		})

		test('deserialization from object', () => {
			const instanceFromObject = SensorValues.fromJSON(EXAMPLE_SENSOR_VALUES)
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_SENSOR_VALUES)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromString = SensorValues.fromJSON(JSON.stringify(EXAMPLE_SENSOR_VALUES))
			return instanceFromString
		})
	})

	describe('toBuffer with zero values', () => {
		test('example 01', () => {
			const example = new SensorValues(
				{
					profilerHits: 0,
					selfCPUTime: 0,
					aggregatedCPUTime: 0,
					internCPUTime: 0,
					externCPUTime: 0,
					langInternalCPUTime: 0,
					selfCPUEnergyConsumption: 0 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 0 as MilliJoule_number,
					internCPUEnergyConsumption: 0 as MilliJoule_number,
					externCPUEnergyConsumption: 0 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 0 as MilliJoule_number
				}
			)
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe('0000')
			const { instance, remainingBuffer } = SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})

		test('example 02', () => {
			const example = new SensorValues(
				{
					profilerHits: 1,
					selfCPUTime: 0,
					aggregatedCPUTime: 3,
					internCPUTime: 0,
					externCPUTime: 4,
					langInternalCPUTime: 0,
					selfCPUEnergyConsumption: 0 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 0.2 as MilliJoule_number,
					internCPUEnergyConsumption: 0 as MilliJoule_number,
					externCPUEnergyConsumption: 0.2 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 0 as MilliJoule_number
				}
			)
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe('95020100000003000000040000009a9999999999c93f9a9999999999c93f')
			const { instance, remainingBuffer } = SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})
		test('example 02', () => {
			const example = new SensorValues(
				{
					profilerHits: 0,
					selfCPUTime: 0,
					aggregatedCPUTime: 0,
					internCPUTime: 0,
					externCPUTime: 0,
					langInternalCPUTime: 0,
					selfCPUEnergyConsumption: 0.01 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 0.1 as MilliJoule_number,
					internCPUEnergyConsumption: 0.02 as MilliJoule_number,
					externCPUEnergyConsumption: 0.03 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 0.04 as MilliJoule_number
				}
			)
			const buffer = example.toBuffer()
			expect(buffer.toString('hex')).toBe('c0077b14ae47e17a843f9a9999999999b93f7b14ae47e17a943fb81e85eb51b89e3f7b14ae47e17aa43f')
			const { instance, remainingBuffer } = SensorValues.consumeFromBuffer(buffer)
			expect(remainingBuffer.byteLength).toBe(0)
			expect(instance.toJSON()).toEqual(example.toJSON())
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_SENSOR_VALUES_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = SensorValues.consumeFromBuffer(buffer)
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
				selfCPUTime: 2,
				aggregatedCPUTime: 3,
				internCPUTime: 4,
				externCPUTime: 5,
				langInternalCPUTime: 6
			})
			instanceB = new SensorValues({
				profilerHits: 7,
				selfCPUTime: 8,
				aggregatedCPUTime: 9,
				internCPUTime: 10,
				externCPUTime: 11,
				langInternalCPUTime: 12
			})
			instanceC = new SensorValues({
				profilerHits: 13,
				selfCPUTime: 14,
				aggregatedCPUTime: 15,
				internCPUTime: 16,
				externCPUTime: 17,
				langInternalCPUTime: 18
			})
		})

		test('max', () => {
			const max = SensorValues.max(instanceA, instanceB, instanceC)

			expect(max.profilerHits).toBe(13)
			expect(max.selfCPUTime).toBe(14)
			expect(max.aggregatedCPUTime).toBe(15)
			expect(max.internCPUTime).toBe(16)
			expect(max.externCPUTime).toBe(17)
			expect(max.langInternalCPUTime).toBe(18)
		})

		test('sum', () => {
			const sum = SensorValues.sum(instanceA, instanceB, instanceC)

			expect(sum.profilerHits).toBe(21)
			expect(sum.selfCPUTime).toBe(24)
			expect(sum.aggregatedCPUTime).toBe(27)
			expect(sum.internCPUTime).toBe(30)
			expect(sum.externCPUTime).toBe(33)
			expect(sum.langInternalCPUTime).toBe(36)
		})

		test('equal', () => {
			expect(SensorValues.equals(instanceA, instanceB)).toBe(false)
			expect(SensorValues.equals(instanceA, instanceC)).toBe(false)
			expect(SensorValues.equals(instanceB, instanceC)).toBe(false)

			expect(SensorValues.equals(instanceA, instanceA)).toBe(true)
			expect(SensorValues.equals(instanceB, instanceB)).toBe(true)
			expect(SensorValues.equals(instanceC, instanceC)).toBe(true)
		})
	})
})
