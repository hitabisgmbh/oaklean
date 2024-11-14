import { NanoSeconds_BigInt } from './TimeHelper'

export interface IPerformanceInterval {
	start: NanoSeconds_BigInt
	end: NanoSeconds_BigInt | null
}

export interface IPerformanceHelper {
	measures: Record<string, number>
}