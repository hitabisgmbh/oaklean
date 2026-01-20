import { BaseModel } from '../../src/model/BaseModel'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { ModelMap, ModelMapKeyType } from '../../src/model/ModelMap'
import { BufferHelper } from '../../src/helper/BufferHelper'
import { UnifiedPath_string } from '../../src/types'

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
		const buffers = [BufferHelper.String2LToBuffer(this.name), BufferHelper.BooleanToBuffer(this.next !== undefined)]
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
		const { instance: name, remainingBuffer: newRemainingBuffer1 } = BufferHelper.String2LFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1
		const instance = new SubClass(name)
		const { instance: nextIsPresent, remainingBuffer: newRemainingBuffer2 } =
			BufferHelper.BooleanFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2
		if (nextIsPresent) {
			const { instance: next, remainingBuffer: newRemainingBuffer } = SubClass.fromBuffer(remainingBuffer)
			remainingBuffer = newRemainingBuffer
			instance.next = next
		}
		return {
			instance,
			remainingBuffer
		}
	}
}

const EXAMPLE_MODEL_MAP: Record<string | number, object | string | number> = {
	'1': 2,
	'./abcd/1234.txt': {
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
	'./1234/abcd.txt': {
		name: '1234-abcd'
	},
	abc: 'xyz'
}

const EXAMPLE_MODEL_MAP_BUFFER =
	'0400000001003101020000000f002e2f616263642f313233342e74787402010061010100620101006301010064000f002e2f313233342f616263642e747874020900313233342d6162636400030061626300030078797a'

function runInstanceTests(
	title: string,
	preDefinedInstance: () => ModelMap<UnifiedPath_string | string | number, SubClass | string | number>
) {
	describe(title, () => {
		let instance: ModelMap<UnifiedPath_string | string | number, SubClass | string | number>

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof ModelMap', () => {
			expect(instance instanceof ModelMap).toBeTruthy()
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

		it('should have a method set()', () => {
			expect(instance.set).toBeTruthy()
		})

		it('should have a method get()', () => {
			expect(instance.get).toBeTruthy()
		})

		it('should have a method has()', () => {
			expect(instance.has).toBeTruthy()
		})

		it('should have a method entries()', () => {
			expect(instance.entries).toBeTruthy()
		})

		it('should have a method keys()', () => {
			expect(instance.keys).toBeTruthy()
		})

		it('should have a method values()', () => {
			expect(instance.values).toBeTruthy()
		})

		it('should have a method forEach()', () => {
			expect(instance.forEach).toBeTruthy()
		})

		test('Symbol.toStringTag', () => {
			expect(Object.prototype.toString.call(instance)).toBe('[object ModelMap]')
		})

		test('Symbol.iterator', () => {
			expect([...instance].sort()).toEqual(
				[
					['./abcd/1234.txt', EXAMPLE_MODEL_MAP['./abcd/1234.txt']],
					['./1234/abcd.txt', EXAMPLE_MODEL_MAP['./1234/abcd.txt']],
					['abc', EXAMPLE_MODEL_MAP['abc']],
					['1', EXAMPLE_MODEL_MAP[1]]
				].sort()
			)
		})

		it('should serialize correctly', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_MAP)
		})

		test('clear', () => {
			instance.clear()
			expect(instance.toJSON()).toEqual(undefined)
		})

		test('delete', () => {
			instance.delete(new UnifiedPath('./abcd/1234.txt').toString())
			expect(instance.toJSON()).toEqual({
				'./1234/abcd.txt': {
					name: '1234-abcd'
				},
				abc: 'xyz',
				'1': 2
			})
		})

		test('has', () => {
			expect(instance.has(new UnifiedPath('./1234/abcd.txt').toString())).toBe(true)
			expect(instance.has(new UnifiedPath('./abcd/1234.txt').toString())).toBe(true)

			expect(instance.has(new UnifiedPath('./xyz/1234.txt').toString())).toBe(false)
		})

		test('size', () => {
			expect(instance.size).toBe(4)
		})

		test('entries', () => {
			const entries: Record<string | number, SubClass | string | number> = {}
			for (const [key, value] of instance.entries()) {
				if (typeof key === 'string') {
					entries[key.toString()] = value
				} else {
					entries[key] = value
				}
			}
			expect(entries).toEqual(EXAMPLE_MODEL_MAP)
		})

		test('keys', () => {
			const keys: (string | number)[] = []
			for (const key of instance.keys()) {
				if (typeof key === 'number') {
					keys.push(key)
				} else {
					keys.push(key.toString())
				}
			}
			expect(keys.sort()).toEqual(['./abcd/1234.txt', './1234/abcd.txt', 'abc', '1'].sort())
		})

		test('values', () => {
			const values: (SubClass | string | number)[] = []
			for (const value of instance.values()) {
				values.push(value)
			}
			expect(values.sort()).toEqual(
				[
					EXAMPLE_MODEL_MAP['./abcd/1234.txt'],
					EXAMPLE_MODEL_MAP['./1234/abcd.txt'],
					EXAMPLE_MODEL_MAP['abc'],
					EXAMPLE_MODEL_MAP[1]
				].sort()
			)
		})

		test('foreach', () => {
			function manipulateItem(
				value: SubClass | string | number,
				key: string | ModelMapKeyType | number,
				map: Map<ModelMapKeyType | string | number, SubClass | string | number>
			) {
				const item = map.get(key)
				if (!item) {
					throw new Error('ModelMap.test.instance related.foreach.manipulateItem item is not defined')
				}
				if (typeof item === 'string') {
					map.set(key, 'manipulated-' + item)
				} else if (typeof item === 'number') {
					map.set(key, item + 1)
				} else {
					item.name = 'manipulated-' + item.name
				}
			}
			instance.forEach(manipulateItem)
			expect((instance.get(new UnifiedPath('./abcd/1234.txt').toString()) as SubClass)?.name).toBe('manipulated-a')
			expect((instance.get(new UnifiedPath('./1234/abcd.txt').toString()) as SubClass)?.name).toBe(
				'manipulated-1234-abcd'
			)
			expect(instance.get('abc')).toBe('manipulated-xyz')
			expect(instance.get('1')).toBe(3)
		})

		test('get', () => {
			expect(instance.get(new UnifiedPath('./abcd/1234.txt').toString())).toEqual({
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
			})

			expect(instance.get(new UnifiedPath('./1234/abcd.txt').toString())).toEqual({
				name: '1234-abcd'
			})

			expect(instance.get('abc')).toBe('xyz')
		})

		test('set', () => {
			EXAMPLE_MODEL_MAP['./test.txt'] = {
				name: 'test'
			}

			instance.set(new UnifiedPath('./test.txt').toString(), new SubClass('test'))
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_MAP)

			delete EXAMPLE_MODEL_MAP['./test.txt']
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_MAP)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toEqual(EXAMPLE_MODEL_MAP_BUFFER)
		})
	})
}

describe('ModelMap', () => {
	runInstanceTests('instance related', () => {
		const subClass = new SubClass('a')
		subClass.next = new SubClass('b')
		subClass.next.next = new SubClass('c')
		subClass.next.next.next = new SubClass('d')

		const instance = new ModelMap<UnifiedPath_string | string, SubClass | string | number>('string')
		instance.set('1', 2)
		instance.set(new UnifiedPath('./abcd/1234.txt').toString(), subClass)
		instance.set(new UnifiedPath('./1234/abcd.txt').toString(), new SubClass('1234-abcd'))
		instance.set('abc', 'xyz')

		return instance
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = ModelMap.fromJSON<UnifiedPath_string | string, SubClass | string | number>(
				JSON.stringify(EXAMPLE_MODEL_MAP),
				'string',
				SubClass.fromJSON
			)
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_MODEL_MAP)
		})

		test('deserialization from object', () => {
			const instanceFromObject = ModelMap.fromJSON<UnifiedPath_string | string | number, SubClass | string | number>(
				EXAMPLE_MODEL_MAP,
				'string',
				SubClass.fromJSON
			) as ModelMap<UnifiedPath_string | string | number, SubClass | string | number>
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_MODEL_MAP)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromObject = ModelMap.fromJSON<UnifiedPath_string | string | number, SubClass | string | number>(
				EXAMPLE_MODEL_MAP,
				'string',
				SubClass.fromJSON
			) as ModelMap<UnifiedPath_string | string | number, SubClass | string | number>
			return instanceFromObject
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_MODEL_MAP_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = ModelMap.consumeFromBuffer<
				UnifiedPath_string | string | number,
				SubClass | string | number
			>(buffer, 'string', SubClass.fromBuffer)
			expect(instance.toJSON()).toEqual(EXAMPLE_MODEL_MAP)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = ModelMap.consumeFromBuffer<UnifiedPath_string | string | number, SubClass | string | number>(
				buffer,
				'string',
				SubClass.fromBuffer
			)
			return instance
		})
	})
})
