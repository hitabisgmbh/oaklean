const MilliSecondsSymbol: unique symbol = Symbol('MilliSecondsSymbol')
export type MilliSeconds_number = number & { [MilliSecondsSymbol]: never }

const MicroSecondsSymbol: unique symbol = Symbol('MicroSecondsSymbol')
export type MicroSeconds_number = number & { [MicroSecondsSymbol]: never }

const NanoSecondsSymbol: unique symbol = Symbol('NanoSecondsSymbol')
export type NanoSeconds_BigInt = bigint & { [NanoSecondsSymbol]: never }

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

	static timestampToHighResolutionTime(
		timestamp: MilliSeconds_number,
		timeDelta?: NanoSeconds_BigInt
	) {
		return BigInt(timestamp) * BigInt(1e6) -
		(timeDelta !== undefined ? timeDelta : loadNanoDiff) as NanoSeconds_BigInt
	}

	static async sleep(millis: number) {
		return new Promise(resolve => setTimeout(resolve, millis))
	}
}