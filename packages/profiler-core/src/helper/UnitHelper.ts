import { MicroSeconds_number, MilliJoule_number } from '../types'

export class UnitHelper {
	static setMicroSecondsSign(
		value: MicroSeconds_number | undefined,
		sign: number
	): MicroSeconds_number {
		return (sign >= 0 ? value || 0 : -(value || 0)) as MicroSeconds_number
	}

	static sumMicroSeconds(
		value1: MicroSeconds_number | undefined,
		value2: MicroSeconds_number | undefined,
		sign: number
	): MicroSeconds_number {
		return ((value1 || 0) +
			UnitHelper.setMicroSecondsSign(value2, sign)) as MicroSeconds_number
	}

	static setMilliJouleSign(
		value: MilliJoule_number | undefined,
		sign: number
	): MilliJoule_number {
		return (sign >= 0 ? value || 0 : -(value || 0)) as MilliJoule_number
	}

	static sumMilliJoule(
		value1: MilliJoule_number | undefined,
		value2: MilliJoule_number | undefined,
		sign: number
	): MilliJoule_number {
		return ((value1 || 0) +
			UnitHelper.setMilliJouleSign(value2, sign)) as MilliJoule_number
	}
}
