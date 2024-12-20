import fs from 'fs'

import { TimeHelper } from './TimeHelper'
import { PermissionHelper } from './PermissionHelper'
import { LoggerHelper } from './LoggerHelper'

import { NanoSeconds_BigInt } from '../types'
import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	IPerformanceInterval,
	IPerformanceHelper
} from '../types/helper/PerformanceHelper'

const ENABLE_PERFORMANCE_TRACKING = process.env.OAKLEAN_ENABLE_PERFORMANCE_TRACKING !== undefined

export class PerformanceHelper {
	private _measures: Map<string, IPerformanceInterval>
	private _firstMeasure: NanoSeconds_BigInt
	private _lastMeasure: NanoSeconds_BigInt

	constructor() {
		this._measures = new Map<string, IPerformanceInterval>()
		this._firstMeasure = BigInt(0) as NanoSeconds_BigInt
		this._lastMeasure = BigInt(0) as NanoSeconds_BigInt
	}

	static loadFromFile(path: UnifiedPath): IPerformanceHelper {
		if (fs.existsSync(path.toPlatformString())) {
			const jsonString = fs.readFileSync(path.toPlatformString(), 'utf8').toString()
			return JSON.parse(jsonString) as IPerformanceHelper
		}
		return { measures: {} }
	}

	static storeToFile(path: UnifiedPath, data: IPerformanceHelper) {
		const dir = path.dirName()
		if (!fs.existsSync(dir.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(dir)
		}
		fs.writeFileSync(path.toPlatformString(), JSON.stringify(data, null, 2))
	}

	exportAndSum(path: UnifiedPath) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const report = PerformanceHelper.loadFromFile(path)

		for (const [name, measure] of this._measures) {
			if (measure.end) {
				const diff = Number(measure.end - measure.start)
				report.measures[name] = (report.measures[name] || 0) + diff
			}
		}
		PerformanceHelper.storeToFile(path, report)
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

	static printAccumulatedReport(path: UnifiedPath) {
		const loadedReport = PerformanceHelper.loadFromFile(path)
		LoggerHelper.log('Accumulated performance report:')
		const report: { [key: string]: Record<string, string> } = {}
		for (const name of Object.keys(loadedReport.measures)) {
			report[name] = {
				'Duration': `${(loadedReport.measures[name] / 1e9).toFixed(3)} s`
			}
		}

		LoggerHelper.table(report, ['Duration'])
	}

	printReport(title: string) {
		if (!ENABLE_PERFORMANCE_TRACKING) {
			return
		}
		const report: { [key: string]: {
			'Duration': string
			'Percentage': string
		} } = {}
		const total = Number(this._lastMeasure - this._firstMeasure)
		for (const [name, measure] of this._measures) {
			if (measure.end) {
				const diff = Number(measure.end - measure.start)
				report[name] = {
					'Duration': `${ (diff / 1e9).toFixed(3) } s`,
					'Percentage': `${ ((diff / total) * 100).toFixed(2) } %`
				}
			} else {
				report[name] = {
					'Duration': 'N/A',
					'Percentage': 'N/A'
				}
			}
		}
		LoggerHelper.log(`Performance report (${title}):`, (total / 1e9).toFixed(3), 's')
		LoggerHelper.table(report, ['Duration', 'Percentage'])
	}
}