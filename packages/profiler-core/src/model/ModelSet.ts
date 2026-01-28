import { BaseModel } from './BaseModel'

import { BufferHelper } from '../helper'

export type ModelSetValueType = string | number | BaseModel

export enum ModelSetValueTypeEnum {
	string = 0,
	number = 1,
	object = 2
}

export class ModelSet<TVALUE extends ModelSetValueType> extends BaseModel {
	private _set: Set<TVALUE>

	constructor() {
		super()
		this._set = new Set()
	}

	get size(): number {
		return this._set.size
	}

	add(value: TVALUE) {
		this._set.add(value)
	}

	delete(value: TVALUE) {
		this._set.delete(value)
	}

	clear() {
		this._set.clear()
	}

	has(value: TVALUE): boolean {
		return this._set.has(value)
	}

	entries(): IterableIterator<TVALUE> {
		return this._set.values()
	}

	get [Symbol.toStringTag]() {
		return 'ModelSet'
	}

	[Symbol.iterator](): IterableIterator<[TVALUE, TVALUE]> {
		return this._set.entries()
	}

	forEach(
		callback: (value: TVALUE, value2: TVALUE, set: Set<TVALUE>) => void,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		thisArg?: any
	): void {
		this._set.forEach(callback, thisArg)
	}

	toJSON<T>(): T[] | undefined {
		if (this._set.size === 0) {
			return undefined
		}
		const result: T[] = []
		for (const value of this._set) {
			if (typeof value === 'string' || typeof value === 'number') {
				result.push(value as unknown as T)
			} else {
				result.push((value as BaseModel).toJSON() as T)
			}
		}
		return result
	}

	static fromJSON<TVALUE extends ModelSetValueType>(
		json: string | object,

		fromJSON: TVALUE extends BaseModel
			? // eslint-disable-next-line @typescript-eslint/no-explicit-any
				(json: string | any, ...args: any[]) => TVALUE
			: 'string' | 'number'
	): ModelSet<TVALUE> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let data: any
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new ModelSet<TVALUE>()

		for (const value of data as TVALUE[]) {
			if (typeof value === 'string' || typeof value === 'number') {
				result.add(value as TVALUE)
			} else {
				if (fromJSON !== 'string' && fromJSON !== 'number') {
					result.add(fromJSON(value) as TVALUE)
				}
			}
		}

		return result
	}

	toBuffer(): Buffer {
		const buffers = [BufferHelper.UIntToBuffer(this._set.size)]

		for (const value of this._set) {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
			switch (typeof value) {
				case 'string':
					buffers.push(BufferHelper.UInt8ToBuffer(ModelSetValueTypeEnum.string))
					buffers.push(BufferHelper.String2LToBuffer(value as string))
					break
				case 'number':
					buffers.push(BufferHelper.UInt8ToBuffer(ModelSetValueTypeEnum.number))
					buffers.push(BufferHelper.UIntToBuffer(value as number))
					break
				default:
					buffers.push(BufferHelper.UInt8ToBuffer(ModelSetValueTypeEnum.object))
					buffers.push((value as BaseModel).toBuffer())
			}
		}
		return Buffer.concat(buffers)
	}

	static consumeFromBuffer<TVALUE extends ModelSetValueType>(
		buffer: Buffer,
		fromBuffer: TVALUE extends BaseModel
			? (
					buffer: Buffer,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					...args: any[]
				) => { instance: TVALUE; remainingBuffer: Buffer }
			: 'string' | 'number'
	): {
		instance: ModelSet<TVALUE>
		remainingBuffer: Buffer
	} {
		let remainingBuffer = buffer
		const { instance: size, remainingBuffer: newRemainingBuffer1 } =
			BufferHelper.UIntFromBuffer(buffer)
		const result = new ModelSet<TVALUE>()
		remainingBuffer = newRemainingBuffer1

		for (let i = 0; i < size; i++) {
			// determine value type
			const { instance: valueType, remainingBuffer: newRemainingBuffer2 } =
				BufferHelper.UInt8FromBuffer(remainingBuffer)
			remainingBuffer = newRemainingBuffer2

			// decode value based on type
			switch (valueType) {
				case ModelSetValueTypeEnum.string:
					{
						const { instance, remainingBuffer: newRemainingBuffer } =
							BufferHelper.String2LFromBuffer(remainingBuffer)
						result.add(instance as TVALUE)
						remainingBuffer = newRemainingBuffer
					}
					break
				case ModelSetValueTypeEnum.number:
					{
						const { instance, remainingBuffer: newRemainingBuffer } =
							BufferHelper.UIntFromBuffer(remainingBuffer)
						result.add(instance as TVALUE)
						remainingBuffer = newRemainingBuffer
					}
					break
				case ModelSetValueTypeEnum.object:
					{
						if (fromBuffer !== 'string' && fromBuffer !== 'number') {
							const { instance, remainingBuffer: newRemainingBuffer } =
								fromBuffer(remainingBuffer)
							result.add(instance as TVALUE)
							remainingBuffer = newRemainingBuffer
						}
					}
					break
				default:
					throw new Error(`Unknown ModelSetValueTypeEnum: ${valueType}`)
			}
		}
		return {
			instance: result,
			remainingBuffer
		}
	}
}
