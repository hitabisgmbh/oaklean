import { TimeHelper } from './TimeHelper'

import { NanoSeconds_BigInt } from '../types'

const ENABLE_PERFORMANCE_TRACKING = process.env.OAKLEAN_ENABLE_PERFORMANCE_TRACKING !== undefined

export type PerformanceInterval = {
	start: NanoSeconds_BigInt
	end: NanoSeconds_BigInt | null
}

export class PerformanceHelper {
	static _measures: Map<string, PerformanceInterval>
	static _firstMeasure: NanoSeconds_BigInt
	static _lastMeasure: NanoSeconds_BigInt

	static measures() {
		if (!PerformanceHelper._measures) {
			PerformanceHelper._measures = new Map<string, PerformanceInterval>()
		}
		return PerformanceHelper._measures
	}

	static clear() {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		PerformanceHelper._measures = new Map<string, PerformanceInterval>()
		PerformanceHelper._firstMeasure = BigInt(0) as NanoSeconds_BigInt
		PerformanceHelper._lastMeasure = BigInt(0) as NanoSeconds_BigInt
	}

	static start(name: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const time = TimeHelper.getCurrentHighResolutionTime()
		if (!PerformanceHelper._firstMeasure) {
			PerformanceHelper._firstMeasure = time
		}
		PerformanceHelper.measures().set(name, {
			start: time,
			end: null
		})
	}

	static stop(name: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const time = TimeHelper.getCurrentHighResolutionTime()
		PerformanceHelper._lastMeasure = time
		const measure = PerformanceHelper.measures().get(name)
		if (measure) {
			measure.end = time
		}
	}

	static printReport(title: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const measures = PerformanceHelper.measures()
		const report: { [key: string]: string[] } = {}
		const total = Number(PerformanceHelper._lastMeasure - PerformanceHelper._firstMeasure)
		for (const [name, measure] of measures) {
			if (measure.end) {
				const diff = Number(measure.end - measure.start)
				report[name] = [`${(diff / 1e9).toFixed(3)} s`, `${((diff / total) * 100).toFixed(2)} %`]
			} else {
				report[name] = ['N/A', 'N/A']
			}
		}
		console.log(`Performance report (${title}):`, (total / 1e9).toFixed(3), 's')
		console.table(report)
	}
}