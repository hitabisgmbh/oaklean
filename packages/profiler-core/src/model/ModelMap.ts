import { BaseModel } from './BaseModel'

import { BufferHelper } from '../helper/BufferHelper'
// Types
import {
	UnifiedPath_string
} from '../types'

export type ModelMapKeyType = UnifiedPath_string | string | number

enum ModelMapValueType {
	string = 0,
	number = 1,
	object = 2
}

export class ModelMap<TKEY extends ModelMapKeyType, TVALUE extends (BaseModel | string | number)> extends BaseModel {
	private _map: Map<TKEY, TVALUE>
	private _keyType: 'string' | 'number'
	
	constructor(keyType: 'string' | 'number') {
		super()
		this._map = new Map<TKEY, TVALUE>()
		this._keyType = keyType
	}

	toJSON<T>(): Record<string | number, T> | undefined {
		if (this._map.size === 0) {
			return undefined
		}
		const result: Record<string | number, T> = {}
		for (const [key, value] of this._map) {
			if (typeof value === 'string') {
				result[key] = value as T
			} else if (typeof value === 'number') {
				result[key] = value as T
			} else {
				result[key] = (value as BaseModel).toJSON() as T
			}
		}
		return result
	}

	static fromJSON<
		TKEY extends ModelMapKeyType,
		TVALUE extends (BaseModel | string | number)
	>(
		json: string | object, // eslint-disable-line @typescript-eslint/no-unused-vars
		keyType: 'string' | 'number',
		fromJSON: TVALUE extends BaseModel ? (json: string | any, ...args: any[]) =>
		TVALUE : 'string' | 'number'
	): ModelMap<TKEY, TVALUE> {
		let data: any
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new ModelMap<TKEY, TVALUE>(keyType)

		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'string' || typeof value === 'number') {
				result.set(key as TKEY, value as TVALUE)
			} else {
				if (fromJSON !== 'string' && fromJSON !== 'number') {
					result.set(key as TKEY, fromJSON(value) as TVALUE)
				}
			}
		}

		return result
	}

	toBuffer(): Buffer {
		const buffers = [BufferHelper.UIntToBuffer(this._map.size)]
		for (const [key, value] of this._map) {
			switch (typeof key) {
				case 'string':
					buffers.push(BufferHelper.String2LToBuffer(key as string))
					break
				case 'number':
					buffers.push(BufferHelper.UIntToBuffer(key as number))
					break
				default:
					throw new Error('ModelMap.toBuffer: unexpected type of key')
			}
			switch (typeof value) {
				case 'string':
					buffers.push(
						BufferHelper.UInt8ToBuffer(ModelMapValueType.string),
						BufferHelper.String2LToBuffer(value as string)
					)
					break
				case 'number':
					buffers.push(
						BufferHelper.UInt8ToBuffer(ModelMapValueType.number),
						BufferHelper.UIntToBuffer(value as number)
					)
					break
				default:
					buffers.push(
						BufferHelper.UInt8ToBuffer(ModelMapValueType.object),
						value.toBuffer()
					)
			}
		}
		return Buffer.concat(buffers)
	}

	static consumeFromBuffer<
		TKEY extends ModelMapKeyType,
		TVALUE extends (BaseModel | string | number)
	>(
		buffer: Buffer,
		keyType: 'string' | 'number',
		consumeFromBuffer: TVALUE extends BaseModel ? (buffer: Buffer, ...args: any[]) =>
		{ instance: TVALUE, remainingBuffer: Buffer } : 'string' | 'number'
	): { instance: ModelMap<TKEY, TVALUE>, remainingBuffer: Buffer } {
		let remainingBuffer = buffer
		const {instance: size, remainingBuffer: newRemainingBuffer1 } = BufferHelper.UIntFromBuffer(buffer)
		remainingBuffer = newRemainingBuffer1

		const result = new ModelMap<TKEY, TVALUE>(keyType)

		for (let i = 0; i < size; i++) {
			let key = undefined
			switch (keyType) {
				case 'string': {
					const {
						instance,
						remainingBuffer: newRemainingBuffer
					} = BufferHelper.String2LFromBuffer(remainingBuffer)
					key = instance
					remainingBuffer = newRemainingBuffer
				} break
				case 'number': {
					const {
						instance,
						remainingBuffer: newRemainingBuffer
					} = BufferHelper.UIntFromBuffer(remainingBuffer)
					key = instance
					remainingBuffer = newRemainingBuffer
				}
			}
			const {
				instance: valueType,
				remainingBuffer: newRemainingBuffer
			} = BufferHelper.UInt8FromBuffer(remainingBuffer)
			remainingBuffer = newRemainingBuffer
			switch (valueType) {
				case ModelMapValueType.object: {
					if (consumeFromBuffer === 'string' || consumeFromBuffer === 'number') {
						throw new Error('ModelMap.consumeFromBuffer: expected a consumeFromBuffer to be given')
					}
					const {
						instance: value,
						remainingBuffer: newRemainingBuffer
					} = consumeFromBuffer(remainingBuffer)
					remainingBuffer = newRemainingBuffer
					result.set(key as TKEY, value as TVALUE)
				} break
				case ModelMapValueType.string: {
					const {
						instance: value,
						remainingBuffer: newRemainingBuffer
					} = BufferHelper.String2LFromBuffer(remainingBuffer)
					remainingBuffer = newRemainingBuffer
					result.set(key as TKEY, value as TVALUE)
				} break
				case ModelMapValueType.number: {
					const {
						instance: value,
						remainingBuffer: newRemainingBuffer
					} = BufferHelper.UIntFromBuffer(remainingBuffer)
					remainingBuffer = newRemainingBuffer
					result.set(key as TKEY, value as TVALUE)
				}
			}
		}
		return {
			instance: result,
			remainingBuffer
		}
	}

	get [Symbol.toStringTag]() {
		return 'ModelMap'
	}

	[Symbol.iterator](): IterableIterator<[TKEY, TVALUE]> {
		return this._map.entries()
	}

	clear(): void {
		this._map.clear()
	}

	delete(key: TKEY): boolean {
		if (typeof key !== this._keyType) {
			throw new Error('ModelMap.delete: Unexpected type for key')
		}
		return this._map.delete(key)
	}

	set(key: TKEY, value: TVALUE): this {
		if (typeof key !== this._keyType) {
			throw new Error('ModelMap.set: Unexpected type for key')
		}
		this._map.set(key, value)
		return this
	}

	get(key: TKEY): TVALUE | undefined {
		if (typeof key !== this._keyType) {
			throw new Error('ModelMap.get: Unexpected type for key')
		}
		return this._map.get(key)
	}

	has(key: TKEY): boolean {
		if (typeof key !== this._keyType) {
			throw new Error('ModelMap.has: Unexpected type for key')
		}
		return this._map.has(key)
	}

	get size(): number {
		return this._map.size
	}

	entries(): IterableIterator<[TKEY, TVALUE]> {
		return this._map.entries()
	}

	keys(): IterableIterator<TKEY> {
		return this._map.keys()
	}

	values(): IterableIterator<TVALUE> {
		return this._map.values()
	}

	forEach(
		callbackfn: (
			value: TVALUE,
			key: TKEY,
			map: Map<TKEY, TVALUE>
		) => void,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		thisArg?: any
	): void {
		this._map.forEach(callbackfn, thisArg)
	}
	
}