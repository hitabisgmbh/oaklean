export abstract class BaseModel {
	abstract toJSON(): object | undefined
	static fromJSON(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		json: string | object,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		...args: any[]
	): object {
		return {}
	}
	static recordToJSON<T>(record: Record<string, BaseModel>): Record<string, T> {
		const result = Object.keys(record).reduce(
			(acc, key) => ({ ...acc, [key]: record[key].toJSON() }),
			{}
		)
		return result
	}

	toBuffer(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		...args: any[]
	): Buffer {
		throw new Error('BaseModel.toBuffer: not implemented yet')
	}
	static consumeFromBuffer(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		buffer: Buffer,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		...args: any[]
	): { instance: object; remainingBuffer: Buffer } {
		throw new Error('BaseModel.consumeFromBuffer: not implemented yet')
	}
}
