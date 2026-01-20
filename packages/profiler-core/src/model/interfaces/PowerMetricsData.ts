import { BaseMetricsData } from './BaseMetricsData'

import { TimeHelper } from '../../helper/TimeHelper'
// Types
import {
	MilliJoule_number,
	MilliSeconds_number,
	NanoSeconds_BigInt,
	IPowerMetricsOutputFormat,
	IPowerMetricsData
} from '../../types'

export class PowerMetricsData extends BaseMetricsData {
	private _data: IPowerMetricsOutputFormat
	private _totalEnergyImpact: number | undefined
	private _energyImpactPerTask: Map<number, number> | undefined

	timeDelta: NanoSeconds_BigInt

	constructor(data: IPowerMetricsOutputFormat) {
		super()
		this._data = data
		this._energyImpactPerTask = undefined
		this.timeDelta = TimeHelper.getTimeDelta()
	}

	toJSON(): IPowerMetricsData {
		return {
			data: {
				...this._data,
				timestamp: this._data.timestamp.toUTCString()
			},
			timeDelta: this.timeDelta.toString()
		}
	}

	static fromJSON(
		json: string | IPowerMetricsData,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
		...args: any[]
	): PowerMetricsData {
		let data: IPowerMetricsData
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new PowerMetricsData({
			...data.data,
			timestamp: new Date(data.data.timestamp)
		})
		result.timeDelta = BigInt(data.timeDelta) as NanoSeconds_BigInt
		return result
	}

	public get duration(): NanoSeconds_BigInt {
		return BigInt(this._data.elapsed_ns) as NanoSeconds_BigInt
	}

	public get startTime(): NanoSeconds_BigInt {
		return TimeHelper.timestampToHighResolutionTime(
			this._data.timestamp.getTime() as MilliSeconds_number,
			this.timeDelta
		)
	}

	public get endTime(): NanoSeconds_BigInt {
		return BigInt(this.startTime + this.duration) as NanoSeconds_BigInt
	}

	energyImpactPerTask() {
		if (this._energyImpactPerTask === undefined) {
			const energyImpactPerTask = new Map<number, number>()
			for (const task of this._data.tasks) {
				energyImpactPerTask.set(task.pid, task.energy_impact)
			}
			this._energyImpactPerTask = energyImpactPerTask
		}
		return this._energyImpactPerTask
	}

	totalEnergyImpact(): number {
		if (this._totalEnergyImpact === undefined) {
			let totalEnergyImpact = 0
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for (const [_, energyImpact] of this.energyImpactPerTask().entries()) {
				totalEnergyImpact += energyImpact
			}
			this._totalEnergyImpact = totalEnergyImpact
		}
		return this._totalEnergyImpact
	}

	processIsPresent(pid: number): boolean {
		return this.energyImpactPerTask().has(pid)
	}

	energyPortionOfProcess(pid: number): number {
		const energyImpactOfProcess = this.energyImpactPerTask().get(pid)

		if (energyImpactOfProcess === undefined) {
			throw new Error(
				'Processes energy could not be found in the PowerMetrics measurements'
			)
		}
		return energyImpactOfProcess / this.totalEnergyImpact()
	}

	cpuEnergy(): MilliJoule_number {
		const power = this._data.processor.cpu_power // in mW = 1e-3 W
		const time = this._data.elapsed_ns // in ns = 1e-9 s

		return ((power * time) / 1e9) as MilliJoule_number // (1e-3 W)*(1e-9 s) = 1e-12 J = 1e-9 mJ
	}

	public ramEnergy(): MilliJoule_number {
		return 0 as MilliJoule_number // sensor interface does not support ram energy measurements
	}
}
