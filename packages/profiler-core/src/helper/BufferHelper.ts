import Zlib from 'zlib'

export enum PrimitiveBufferTypes {
	UInt,
	Double,
	String2L,
	String4L,
	Boolean,
	UInt8 // unsigned tiny int
}

type PrimitiveBufferTypes_ByteSize_Map = {
	[key in PrimitiveBufferTypes]: number
};

export const PRIMITIVE_BUFFER_TYPES_BYTE_SIZES: PrimitiveBufferTypes_ByteSize_Map = {
	[PrimitiveBufferTypes.UInt]: 4,
	[PrimitiveBufferTypes.Double]: 8,
	[PrimitiveBufferTypes.String2L]: 2**16 - 1,
	[PrimitiveBufferTypes.String4L]: 2 ** 32 - 1,
	[PrimitiveBufferTypes.Boolean]: 1,
	[PrimitiveBufferTypes.UInt8]: 1,
}

type BufferValueMapTypeMap<T> = {
	[key in keyof T]: PrimitiveBufferTypes.UInt | PrimitiveBufferTypes.Double
}

const VALUE_MAP_HEADER_SIZE = 2 // in bytes

export class BufferHelper {
	static numberMapToBuffer(
		typeMap: BufferValueMapTypeMap<Record<string, number>>,
		values: Record<string, number>,
		keyOffset?: number
	): Buffer {
		// first segmentSize * 8 - 1 bits are used to mark wether a value is present
		// the (segmentSize * 8)th bit marks wether there comes a valueMap behind
		const valueIsPresent_Buffer = Buffer.alloc(VALUE_MAP_HEADER_SIZE)
		const keys = Array.from(Object.keys(typeMap))
		const valueBuffers: Buffer[] = []

		const valueLen = Math.min(VALUE_MAP_HEADER_SIZE * 8 - 1, keys.length - (keyOffset || 0))
		for (let i = 0; i < valueLen; i++) {
			const key = keys[i + (keyOffset || 0)]
			const byteSize = typeMap[key]
			if (values[key] !== undefined && values[key] !== 0) {
				switch (byteSize) {
					case PrimitiveBufferTypes.UInt:
						valueBuffers.push(BufferHelper.UIntToBuffer(values[key], key))
						break
					case PrimitiveBufferTypes.Double:
						valueBuffers.push(BufferHelper.DoubleToBuffer(values[key]))
						break
					default:
						throw new Error('BufferHelper.valueMap: unexpected byte size')
				}
				BufferHelper.setBit(valueIsPresent_Buffer, i, 1)
			}
		}
		if (keys.length - (keyOffset || 0) > VALUE_MAP_HEADER_SIZE *8 - 1) {
			const nextBuffer = BufferHelper.numberMapToBuffer(
				typeMap,
				values,
				(keyOffset || 0) + valueLen
			)
			if (nextBuffer.subarray(0, VALUE_MAP_HEADER_SIZE).toString('hex') === '00'.repeat(VALUE_MAP_HEADER_SIZE)) {
				return Buffer.concat([valueIsPresent_Buffer, ...valueBuffers])
			}
			BufferHelper.setBit(valueIsPresent_Buffer, VALUE_MAP_HEADER_SIZE * 8 - 1, 1)

			// still values to store
			return Buffer.concat([valueIsPresent_Buffer, ...valueBuffers, nextBuffer])
		}
		return Buffer.concat([valueIsPresent_Buffer, ...valueBuffers])
	}

	static numberMapFromBuffer(
		typeMap: BufferValueMapTypeMap<Record<string, number>>,
		buffer: Buffer
	): { instance: Record<string, number>, remainingBuffer: Buffer } {
		const { result: numberArray, remainingBuffer } = BufferHelper.numberArrayFromBuffer(
			buffer,
			typeMap
		)

		const result: Record<string, number> = {}
		const keys = Array.from(Object.keys(typeMap))
		for (let i = 0; i < keys.length; i++) {
			result[keys[i]] = numberArray[i] || 0
		}
		return {
			instance: result,
			remainingBuffer
		}
	}

	static numberArrayFromBuffer(
		buffer: Buffer,
		typeMap: BufferValueMapTypeMap<Record<string, number>>,
		keyOffset?: number
	): { result: number[], remainingBuffer: Buffer } {
		if (buffer.byteLength < 2) {
			throw new Error('BufferHelper.valueMapFromBuffer: not enough bytes remaining')
		}
		const valueIsPresent_Buffer = buffer.subarray(0, 2)
		let remainingBuffer = buffer.subarray(2)
		const keys = Array.from(Object.keys(typeMap))
		const data: number[] = []

		for (let i = 0; i < VALUE_MAP_HEADER_SIZE * 8 - 1; i++) {
			const key = keys[i + (keyOffset || 0)]
			if (BufferHelper.readBit(valueIsPresent_Buffer, i) === 1) {
				switch (typeMap[key]) {
					case PrimitiveBufferTypes.UInt: {
						const {
							instance,
							remainingBuffer: newRemainingBuffer
						} = BufferHelper.UIntFromBuffer(remainingBuffer)
						remainingBuffer = newRemainingBuffer
						data.push(instance)
					} break
					case PrimitiveBufferTypes.Double: {
						const {
							instance,
							remainingBuffer: newRemainingBuffer
						} = BufferHelper.DoubleFromBuffer(remainingBuffer)
						remainingBuffer = newRemainingBuffer
						data.push(instance)
					} break
					default:
						throw new Error('SensorValues.toBuffer: unexpected primitive buffer type')
				}
			} else {
				data.push(0)
			}
		}

		if (
			keys.length - (keyOffset || 0) > VALUE_MAP_HEADER_SIZE * 8 - 1 &&
			BufferHelper.readBit(valueIsPresent_Buffer, VALUE_MAP_HEADER_SIZE * 8 - 1) === 1
		) {
			// still values to read
			const { result, remainingBuffer: remainingBuffer_childCall } = BufferHelper.numberArrayFromBuffer(
				remainingBuffer,
				typeMap,
				(keyOffset || 0) + VALUE_MAP_HEADER_SIZE * 8 - 1
			)
			return {
				result: [...data, ...result],
				remainingBuffer: remainingBuffer_childCall
			}
		}
		return {
			result: data,
			remainingBuffer: remainingBuffer
		}
	}

	static UInt8ToBuffer(tinyInt: number): Buffer {
		if (tinyInt < 0 || tinyInt > 2 ** (PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt] * 8) - 1) {
			throw new Error(`BufferHelper.TIntToBuffer: value out of domain: ${tinyInt}`)
		}

		const result = Buffer.alloc(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt8])
		result.writeUInt8(tinyInt)
		return result
	}

	static UInt8FromBuffer(buffer: Buffer): {
		instance: number,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt8]) {
			throw new Error('BufferHelper.TIntFromBuffer: not enough bytes remaining')
		}
		const instance = buffer.readUInt8()
		return {
			instance: instance,
			remainingBuffer: buffer.subarray(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt8])
		}
	}

	static BooleanToBuffer(bool: boolean): Buffer {
		const result = Buffer.alloc(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Boolean])
		result.writeInt8(bool ? 1 : 0)
		return result
	}

	static BooleanFromBuffer(buffer: Buffer): {
		instance: boolean,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Boolean]) {
			throw new Error('BufferHelper.BooleanFromBuffer: not enough bytes remaining')
		}
		const instance = buffer.readInt8()
		return {
			instance: instance === 0 ? false : true,
			remainingBuffer: buffer.subarray(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Boolean])
		}
	}

	static UIntToBuffer(int: number, message?: string): Buffer {
		if (int < 0 || int > 2 ** (PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt] * 8) - 1) {
			throw new Error(`BufferHelper.UIntToBuffer: value out of domain: ${int} : ${message}`)
		}
		const result = Buffer.alloc(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt])
		result.writeUInt32LE(int)
		return result
	}

	static UIntFromBuffer(buffer: Buffer): {
		instance: number,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt]) {
			throw new Error('BufferHelper.UIntFromBuffer: not enough bytes remaining')
		}
		const instance = buffer.readUInt32LE()
		return {
			instance,
			remainingBuffer: buffer.subarray(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.UInt])
		}
	}

	static DoubleToBuffer(double: number): Buffer {
		const result = Buffer.alloc(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Double])
		result.writeDoubleLE(double)
		return result
	}

	static DoubleFromBuffer(buffer: Buffer): {
		instance: number,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Double]) {
			throw new Error('BufferHelper.DoubleFromBuffer: not enough bytes remaining')
		}
		const instance = buffer.readDoubleLE()
		return {
			instance,
			remainingBuffer: buffer.subarray(PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.Double])
		}
	}

	static String2LToBuffer(string: string): Buffer {
		if (string.length > PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.String2L]) {
			throw new Error('BufferHelper.String2LToBuffer: only supports string smaller than 2^16 - 1 characters')
		}

		const string_Buffer = Buffer.from(string)
		const length_Buffer = Buffer.alloc(2)
		length_Buffer.writeUInt16LE(string_Buffer.byteLength)

		return Buffer.concat([length_Buffer, string_Buffer])
	}

	static String2LFromBuffer(buffer: Buffer): {
		instance: string,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < 2) {
			throw new Error('BufferHelper.String2LFromBuffer: not enough bytes remaining')
		}
		const length = buffer.readUInt16LE()
		if (buffer.byteLength - 2 - length < 0) {
			throw new Error('BufferHelper.String2LFromBuffer: not enough bytes remaining')
		}
		const string = buffer.subarray(2, 2 + length).toString('utf-8')

		return {
			instance: string,
			remainingBuffer: buffer.subarray(2 + length)
		}
	}

	static String4LToBuffer(string: string): Buffer {
		if (string.length > PRIMITIVE_BUFFER_TYPES_BYTE_SIZES[PrimitiveBufferTypes.String4L]) {
			throw new Error('BufferHelper.String4LToBuffer: only supports string smaller than 2^32 - 1 characters')
		}

		const string_Buffer = Buffer.from(string)
		const length_Buffer = Buffer.alloc(4)
		length_Buffer.writeUInt32LE(string_Buffer.byteLength)

		return Buffer.concat([length_Buffer, string_Buffer])
	}

	static String4LFromBuffer(buffer: Buffer): {
		instance: string,
		remainingBuffer: Buffer
	} {
		if (buffer.byteLength < 4) {
			throw new Error('BufferHelper.String4LFromBuffer: not enough bytes remaining')
		}
		const length = buffer.readUInt32LE()
		if (buffer.byteLength - 4 - length < 0) {
			throw new Error('BufferHelper.String4LFromBuffer: not enough bytes remaining')
		}
		const string = buffer.subarray(4, 4 + length).toString('utf-8')

		return {
			instance: string,
			remainingBuffer: buffer.subarray(4 + length)
		}
	}

	static readBit(buffer: Buffer, bit: number) {
		const i = Math.floor(bit / 8)

		return (buffer[i] >> (bit % 8)) % 2
	}

	static setBit(buffer: Buffer, bit: number, value: number) {
		const i = Math.floor(bit / 8)

		if (value === 0) {
			buffer[i] &= ~(1 << (bit % 8))
		} else {
			buffer[i] |= (1 << (bit % 8))
		}
	}

	static async compressBuffer(buffer: Buffer): Promise<Buffer | Error> {
		return new Promise((resolve, reject) => {
			Zlib.deflate(buffer, (error: Error | null, result: Buffer) => {
				if (error === null) {
					resolve(result)
				} else {
					reject(error)
				}
			})
		})
	}

	static async decompressBuffer(
		buffer: Buffer,
		maxOutputLength: number = 100 * 1024 * 1024
	): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			Zlib.inflate(buffer, { 
				maxOutputLength // protect against zip bombs
			}, (error: Error | null, result: Buffer) => {
				if (error === null) {
					resolve(result)
				} else {
					reject(error)
				}
			})
		})
	}
}