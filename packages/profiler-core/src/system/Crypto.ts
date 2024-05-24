import crypto from 'crypto'

import { v4 as uuidv4 } from 'uuid'

const UUID4_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

const UUIDSymbol: unique symbol = Symbol('IUUIDSymbol')
export type UUID_string = string & { [UUIDSymbol]: never }

export class Crypto {
	static hash(value: string | Buffer): string {
		return crypto.createHash('sha256').update(value).digest('hex')
	}

	static uniqueID(): UUID_string {
		return uuidv4() as UUID_string
	}

	static validateUniqueID(id: UUID_string): boolean {
		return UUID4_REGEX.test(id)
	}
}
