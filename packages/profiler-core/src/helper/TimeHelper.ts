// Types
import { NanoSeconds_BigInt, MilliSeconds_number } from '../types'

const loadNs = process.hrtime.bigint()
const loadMs = Date.now()
const loadNanoDiff = BigInt(loadMs) * BigInt(1e6) - loadNs
export class TimeHelper {
	static getCurrentTimestamp(): number {
		return new Date().getTime()
	}

	static getTimeDelta(): NanoSeconds_BigInt {
		return loadNanoDiff as NanoSeconds_BigInt
	}

	static getCurrentHighResolutionTime(): NanoSeconds_BigInt {
		return process.hrtime.bigint() as NanoSeconds_BigInt
	}

	static timestampToHighResolutionTime(timestamp: MilliSeconds_number, timeDelta?: NanoSeconds_BigInt) {
		return (BigInt(timestamp) * BigInt(1e6) -
			(timeDelta !== undefined ? timeDelta : loadNanoDiff)) as NanoSeconds_BigInt
	}

	static async sleep(millis: number) {
		return new Promise((resolve) => setTimeout(resolve, millis))
	}
}
