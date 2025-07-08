import crypto from 'crypto'

import { v4 as uuidv4 } from 'uuid'

// Types
import {
	UUID_string
} from '../types'

const UUID4_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

export class Crypto {
	static hash(value: string | Buffer): string {
		return crypto.createHash('sha256').update(value).digest('hex')
	}

	static smallHash(input: string): string {
		return crypto.createHash('sha1').update(input).digest('base64url').slice(0, 8)
	}

	static uniqueID(): UUID_string {
		return uuidv4() as UUID_string
	}

	static validateUniqueID(id: UUID_string): boolean {
		return UUID4_REGEX.test(id)
	}
}
