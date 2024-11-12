import { TimeHelper } from './TimeHelper'

import { NanoSeconds_BigInt } from '../types'

const ENABLE_PERFORMANCE_TRACKING = process.env.OAKLEAN_ENABLE_PERFORMANCE_TRACKING !== undefined

export type PerformanceInterval = {
	start: NanoSeconds_BigInt
	end: NanoSeconds_BigInt | null
}

export class PerformanceHelper {
	private _measures: Map<string, PerformanceInterval>
	private _firstMeasure: NanoSeconds_BigInt
	private _lastMeasure: NanoSeconds_BigInt

	constructor() {
		this._measures = new Map<string, PerformanceInterval>()
		this._firstMeasure = BigInt(0) as NanoSeconds_BigInt
		this._lastMeasure = BigInt(0) as NanoSeconds_BigInt
	}

	start(name: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const time = TimeHelper.getCurrentHighResolutionTime()
		if (!this._firstMeasure) {
			this._firstMeasure = time
		}
		this._measures.set(name, {
			start: time,
			end: null
		})
	}

	stop(name: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const time = TimeHelper.getCurrentHighResolutionTime()
		this._lastMeasure = time
		const measure = this._measures.get(name)
		if (measure) {
			measure.end = time
		}
	}

	printReport(title: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const report: { [key: string]: string[] } = {}
		const total = Number(this._lastMeasure - this._firstMeasure)
		for (const [name, measure] of this._measures) {
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