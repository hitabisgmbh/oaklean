export abstract class BaseModel {
	abstract toJSON(): object | undefined
	static fromJSON(
		json: string | object, // eslint-disable-line @typescript-eslint/no-unused-vars
		...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	): object {
		return {}
	}
	static recordToJSON<T>(record: Record<string, BaseModel>): Record<string, T> {
		const result = Object.keys(record).reduce((acc, key) => ({ ...acc, [key]: record[key].toJSON() }), {})
		return result
	}

	toBuffer(
		...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	): Buffer {
		throw new Error('BaseModel.toBuffer: not implemented yet')
	}
	static consumeFromBuffer(
		buffer: Buffer, // eslint-disable-line @typescript-eslint/no-unused-vars
		...args: any[] // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
	): { instance: object; remainingBuffer: Buffer } {
		throw new Error('BaseModel.consumeFromBuffer: not implemented yet')
	}
}
