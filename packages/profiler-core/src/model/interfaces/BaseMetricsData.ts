// Types
import {
	MilliJoule_number,
	NanoSeconds_BigInt,
	IPowerMetricsData,
	IPerfMetricsData,
	IWindowsSensorInterfaceMetricsData
} from '../../types'

export class BaseMetricsData {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	processIsPresent(pid: number): boolean {
		throw new Error('BaseMetricsData.processPresent must be implemented')
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	energyPortionOfProcess(pid: number): number {
		throw new Error('BaseMetricsData.energyPortionOfProcess must be implemented')
	}

	totalEnergyImpact(): number {
		throw new Error('BaseMetricsData.totalEnergyImpact must be implemented')
	}

	public get duration(): NanoSeconds_BigInt {
		throw new Error('BaseMetricsData.duration must be implemented')
	}

	public get startTime(): NanoSeconds_BigInt {
		throw new Error('BaseMetricsData.startTime must be implemented')
	}

	public get endTime(): NanoSeconds_BigInt {
		throw new Error('BaseMetricsData.endTime must be implemented')
	}

	public cpuEnergy(): MilliJoule_number {
		throw new Error('BaseMetricsData.cpuEnergy must be implemented')
	}

	public ramEnergy(): MilliJoule_number {
		throw new Error('BaseMetricsData.ramEnergy must be implemented')
	}

	toJSON(): IPowerMetricsData | IPerfMetricsData | IWindowsSensorInterfaceMetricsData {
		throw new Error('BaseMetricsData.toJSON must be implemented')
	}

	static fromJSON(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		json: string | object,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		...args: any[]
	): object {
		throw new Error('BaseMetricsData.fromJSON must be implemented')
	}
}
