import { BaseMetricsData } from './BaseMetricsData'

// Types
import {
	MilliJoule_number,
	NanoSeconds_BigInt,
	IPerfMetricsDataOutputFormat,
	IPerfMetricsData
} from '../../types'

export class PerfMetricsData extends BaseMetricsData {
	private _data: IPerfMetricsDataOutputFormat

	constructor(data: IPerfMetricsDataOutputFormat) {
		super()
		this._data = data
	}

	toJSON(): IPerfMetricsData {
		return {
			data: {
				elapsed_ns: this._data.elapsed_ns.toString(),
				cpu_energy: this._data.cpu_energy,
				ram_energy: this._data.ram_energy,
				timestamp: this._data.timestamp.toString()
			}
		}
	}

	static fromJSON(json: string | IPerfMetricsData, ...args: any[]): PerfMetricsData {
		let data: IPerfMetricsData
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new PerfMetricsData({
			elapsed_ns: BigInt(data.data.elapsed_ns) as NanoSeconds_BigInt,
			cpu_energy: data.data.cpu_energy,
			ram_energy: data.data.ram_energy,
			timestamp: BigInt(data.data.timestamp) as NanoSeconds_BigInt
		})
		return result
	}

	public get duration(): NanoSeconds_BigInt {
		return this._data.elapsed_ns
	}

	public get startTime(): NanoSeconds_BigInt {
		return this._data.timestamp
	}

	processIsPresent(pid: number): boolean {
		return true
	}

	energyPortionOfProcess(pid: number): number {
		return 1
	}

	public get endTime(): NanoSeconds_BigInt {
		return BigInt(this.startTime + this.duration) as NanoSeconds_BigInt
	}

	cpuEnergy(): MilliJoule_number {
		return this._data.cpu_energy
	}

	ramEnergy(): MilliJoule_number {
		return this._data.ram_energy
	}
}