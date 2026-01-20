import crypto from 'crypto'

// Types
import { UUID_string } from '../types'

const UUID4_REGEX =
	/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

export class Crypto {
	static hash(value: string | Buffer): string {
		return crypto.createHash('sha256').update(value).digest('hex')
	}

	static smallHash(input: string): string {
		return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8)
	}

	private static uuidModule: typeof import('uuid').v4 | null = null
	static async getUUIDModule() {
		if (Crypto.uuidModule === null) {
			Crypto.uuidModule = (await import('uuid')).v4
		}

		return Crypto.uuidModule
	}

	static async uniqueID(): Promise<UUID_string> {
		return (await Crypto.getUUIDModule())() as UUID_string
	}

	static validateUniqueID(id: UUID_string): boolean {
		return UUID4_REGEX.test(id)
	}
}
