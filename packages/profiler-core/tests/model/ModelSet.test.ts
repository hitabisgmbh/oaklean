import { BaseModel } from '../../src/model/BaseModel'
import { ModelSet, ModelSetValueType } from '../../src/model/ModelSet'
import { BufferHelper } from '../../src/helper/BufferHelper'

type ISubClass = {
	name: string
	next: ISubClass | undefined
}

class SubClass extends BaseModel {
	name: string
	next: SubClass | undefined

	constructor(name: string) {
		super()
		this.name = name
	}

	toJSON(): ISubClass {
		return {
			name: this.name,
			next: this.next?.toJSON()
		}
	}

	static fromJSON(
		json: string | ISubClass,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		...args: any[]
	): SubClass {
		let data: ISubClass
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new SubClass(data.name)
		if (data.next !== undefined) {
			result.next = SubClass.fromJSON(data.next)
		}
		return result
	}

	toBuffer(): Buffer {
		const buffers = [
			BufferHelper.String2LToBuffer(this.name),
			BufferHelper.BooleanToBuffer(this.next !== undefined)
		]
		if (this.next !== undefined) {
			buffers.push(this.next.toBuffer())
		}

		return Buffer.concat(buffers)
	}

	static fromBuffer(buffer: Buffer): {
		instance: SubClass
		remainingBuffer: Buffer
	} {
		let remainingBuffer = buffer
		const { instance: name, remainingBuffer: newRemainingBuffer1 } =
			BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1
		const instance = new SubClass(name)
		const { instance: nextIsPresent, remainingBuffer: newRemainingBuffer2 } =
			BufferHelper.BooleanFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2
		if (nextIsPresent) {
			const { instance: next, remainingBuffer: newRemainingBuffer } =
				SubClass.fromBuffer(remainingBuffer)
			remainingBuffer = newRemainingBuffer
			instance.next = next
		}
		return {
			instance,
			remainingBuffer
		}
	}
}

const EXAMPLE_MODEL_SET: (number | string | object)[] = [
	2,
	{
		name: 'a',
		next: {
			name: 'b',
			next: {
				name: 'c',
				next: {
					name: 'd'
				}
			}
		}
	},
	{
		name: '1234-abcd'
	},
	'xyz'
]

const EXAMPLE_MODEL_SET_BUFFER =
	'0400000001020000000201006101010062010100630101006400020900313233342d616263640000030078797a'

function runInstanceTests(
	title: string,
	preDefinedInstance: () => {
		instance: ModelSet<SubClass | string | number>
		values: (SubClass | string | number)[]
	}
) {
	describe(title, () => {
		let instance: ModelSet<SubClass | string | number>
		let values: (SubClass | string | number)[]

		beforeEach(() => {
			;({ instance, values } = preDefinedInstance())
		})

		it('instance should be an instanceof ModelSet', () => {
			expect(instance instanceof ModelSet).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a method clear()', () => {
			expect(instance.clear).toBeTruthy()
		})

		it('should have a method delete()', () => {
			expect(instance.delete).toBeTruthy()
		})

		it('should have a method add()', () => {
			expect(instance.add).toBeTruthy()
		})

		it('should have a method has()', () => {
			expect(instance.has).toBeTruthy()
		})

		it('should have a method entries()', () => {
			expect(instance.entries).toBeTruthy()
		})

		it('should have a method forEach()', () => {
			expect(instance.forEach).toBeTruthy()
		})

		test('Symbol.toStringTag', () => {
			expect(Object.prototype.toString.call(instance)).toBe('[object ModelSet]')
		})

		test('Symbol.iterator', () => {
			expect([...instance].sort()).toEqual(
				[
					[EXAMPLE_MODEL_SET[0], EXAMPLE_MODEL_SET[0]],
					[EXAMPLE_MODEL_SET[1], EXAMPLE_MODEL_SET[1]],
					[EXAMPLE_MODEL_SET[2], EXAMPLE_MODEL_SET[2]],
					[EXAMPLE_MODEL_SET[3], EXAMPLE_MODEL_SET[3]]
				].sort()
			)
		})

		it('should serialize correctly', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_SET)
		})

		test('clear', () => {
			instance.clear()
			expect(instance.toJSON()).toEqual(undefined)
		})

		test('delete', () => {
			instance.delete(values[1])
			expect(instance.toJSON()).toEqual([
				2,
				{
					name: '1234-abcd'
				},
				'xyz'
			])
		})

		test('add', () => {
			const newValue = new SubClass('new-value')
			instance.add(newValue)
			expect(instance.has(newValue)).toBe(true)
			instance.delete(newValue)
			expect(instance.has(newValue)).toBe(false)

			// add existing value
			instance.add(values[1])
			expect(instance.size).toBe(4)
		})

		test('has', () => {
			expect(instance.has(2)).toBe(true)
			expect(instance.has('xyz')).toBe(true)

			expect(instance.has(3)).toBe(false)
		})

		test('size', () => {
			expect(instance.size).toBe(4)
		})

		test('entries', () => {
			const entries: ModelSetValueType[] = []
			for (const value of instance.entries()) {
				entries.push(value)
			}
			expect(entries).toEqual(EXAMPLE_MODEL_SET)
		})

		test('foreach', () => {
			const forEachValues: ModelSetValueType[] = []
			function manipulateItem(value: SubClass | string | number) {
				forEachValues.push(value)
			}
			instance.forEach(manipulateItem)
			expect(forEachValues).toEqual(values)
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_SET)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toEqual(
				EXAMPLE_MODEL_SET_BUFFER
			)
		})
	})
}

describe('ModelSet', () => {
	runInstanceTests('instance related', () => {
		const values: (SubClass | string | number)[] = []
		const subClass = new SubClass('a')
		subClass.next = new SubClass('b')
		subClass.next.next = new SubClass('c')
		subClass.next.next.next = new SubClass('d')

		const instance = new ModelSet<SubClass | string | number>()
		instance.add(2)
		values.push(2)
		instance.add(subClass)
		values.push(subClass)
		const subClass2 = new SubClass('1234-abcd')
		instance.add(subClass2)
		values.push(subClass2)
		instance.add('xyz')
		values.push('xyz')

		return { instance, values }
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = ModelSet.fromJSON<SubClass | string | number>(
				JSON.stringify(EXAMPLE_MODEL_SET),
				SubClass.fromJSON
			)
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_MODEL_SET)
		})

		test('deserialization from object', () => {
			const instanceFromObject = ModelSet.fromJSON<SubClass | string | number>(
				EXAMPLE_MODEL_SET,
				SubClass.fromJSON
			) as ModelSet<SubClass | string | number>
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_MODEL_SET)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromObject = ModelSet.fromJSON<SubClass | string | number>(
				EXAMPLE_MODEL_SET,
				SubClass.fromJSON
			) as ModelSet<SubClass | string | number>
			return {
				instance: instanceFromObject,
				values: Array.from(instanceFromObject.entries())
			}
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_MODEL_SET_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = ModelSet.consumeFromBuffer(
				buffer,
				SubClass.fromBuffer
			)
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_SET)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = ModelSet.consumeFromBuffer(
				buffer,
				SubClass.fromBuffer
			)
			return {
				instance: instance,
				values: Array.from(instance.entries())
			}
		})
	})
})
