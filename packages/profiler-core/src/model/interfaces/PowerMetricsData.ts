import { BaseMetricsData, MilliJoule_number } from './BaseMetricsData'

import { MilliSeconds_number, NanoSeconds_BigInt, TimeHelper } from '../../helper/TimeHelper'
import { SensorInterfaceType } from '../ProfilerConfig'

export interface ITaskInfos {
	pid: number,
	name: string,
	started_abstime_ns: number,
	interval_ns: number,
	cputime_ns: number,
	cputime_ms_per_s: number,
	cputime_sample_ms_per_s: number,
	cputime_userland_ratio: number,
	intr_wakeups: number,
	intr_wakeups_per_s: number,
	idle_wakeups: number,
	idle_wakeups_per_s: number,
	timer_wakeups:
	{
		interval_ns: number,
		wakeups: number,
		wakeups_per_s: number
	}[],
	diskio_bytesread: number,
	diskio_bytesread_per_s: number,
	diskio_byteswritten: number,
	diskio_byteswritten_per_s: number,
	pageins: number,
	pageins_per_s: number,
	qos_disabled_ns: number,
	qos_disabled_ms_per_s: number,
	qos_maintenance_ns: number,
	qos_maintenance_ms_per_s: number,
	qos_background_ns: number,
	qos_background_ms_per_s: number,
	qos_utility_ns: number,
	qos_utility_ms_per_s: number,
	qos_default_ns: number,
	qos_default_ms_per_s: number,
	qos_user_initiated_ns: number,
	qos_user_initiated_ms_per_s: number,
	qos_user_interactive_ns: number,
	qos_user_interactive_ms_per_s: number,
	packets_received: number,
	packets_received_per_s: number,
	packets_sent: number,
	packets_sent_per_s: number,
	bytes_received: number,
	bytes_received_per_s: number,
	bytes_sent: number,
	bytes_sent_per_s: number,
	energy_impact: number,
	energy_impact_per_s: number
}

export interface IProcessorOutputFormat {
	cpu_energy: number;
	cpu_power: number
	gpu_energy: number
	gpu_power: number
	ane_energy: number
	ane_power: number
	combined_power: number
}

export interface IPowerMetricsOutputFormat {
	is_delta: boolean,
	elapsed_ns: number,
	hw_model: string,
	kern_osversion: string,
	kern_bootargs: string,
	kern_boottime: string
	timestamp: Date,
	tasks: ITaskInfos[]
	processor: IProcessorOutputFormat
}

export interface IPowerMetricsData {
	data: {
		is_delta: boolean,
		elapsed_ns: number,
		hw_model: string,
		kern_osversion: string,
		kern_bootargs: string,
		kern_boottime: string
		timestamp: string,
		tasks: ITaskInfos[]
		processor: IProcessorOutputFormat
	},
	timeDelta: string
}

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

	static fromJSON(json: string | IPowerMetricsData, ...args: any[]): PowerMetricsData {
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
	
	public get duration() : NanoSeconds_BigInt {
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
			const energyImpactPerTask = new Map<number, number>
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
			throw new Error('Processes energy could not be found in the PowerMetrics measurements')
		}
		return energyImpactOfProcess / this.totalEnergyImpact()
	}

	cpuEnergy(): MilliJoule_number {
		const power = this._data.processor.cpu_power // in mW = 1e-3 W
		const time = this._data.elapsed_ns // in ns = 1e-9 s

		return power * time / 1e9 as MilliJoule_number // (1e-3 W)*(1e-9 s) = 1e-12 J = 1e-9 mJ
	}

	public ramEnergy(): MilliJoule_number {
		return 0 as MilliJoule_number // sensor interface does not support ram energy measurements
	}
}