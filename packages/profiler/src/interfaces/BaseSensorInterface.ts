import { MetricsDataCollection, NanoSeconds_BigInt, SensorInterfaceType } from '@oaklean/profiler-core'

export class BaseSensorInterface {
	protected _couldBeExecuted: boolean | undefined

	type(): SensorInterfaceType {
		throw new Error('BaseSensorInterface.type must be implemented')
	}

	async couldBeExecuted(): Promise<boolean> {
		if (this._couldBeExecuted === undefined) {
			this._couldBeExecuted = await this.canBeExecuted()
		}
		return this._couldBeExecuted
	}

	async canBeExecuted(): Promise<boolean> {
		throw new Error('BaseSensorInterface.canBeExecuted must be implemented')
	}

	isRunning(): boolean {
		throw new Error('BaseSensorInterface.isRunning must be implemented')
	}

	get startTime(): NanoSeconds_BigInt | undefined {
		throw new Error('BaseSensorInterface.startTime must be implemented')
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async readSensorValues(pid: number): Promise<MetricsDataCollection | undefined> {
		throw new Error('BaseSensorInterface.readSensorValues must be implemented')
	}

	async startProfiling() {
		throw new Error('BaseSensorInterface.startProfiling must be implemented')
	}

	async measurementStarted() {
		throw new Error('BaseSensorInterface.measurementStarted must be implemented')
	}

	async stopProfiling() {
		throw new Error('BaseSensorInterface.stopProfiling must be implemented')
	}

	static pidIsRunning(pid: number) {
		try {
			process.kill(pid, 0)
			return true
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			return false
		}
	}
}
