import * as fs from 'fs'
import { ChildProcess, spawn } from 'child_process'

import {
	MetricsDataCollection,
	WindowsSensorInterfaceMetricsData,
	IWindowsSensorInterfaceOptions,
	TimeHelper,
	NanoSeconds_BigInt,
	MetricsDataCollectionType,
	MilliJoule_number,
	SensorInterfaceType,
	PermissionHelper,
	LoggerHelper
} from '@oaklean/profiler-core'
import {
	getPlatformSpecificBinaryPath,
	SupportedPlatforms
} from '@oaklean/windows-sensorinterface'

import { BaseSensorInterface } from '../BaseSensorInterface'

/**
 * This SensorInterface uses the data provided by the libre hardware monitor command line tool.
 * This Provider can only be used on Windows
 */

export enum WindowsSensorInterfaceEvent {
	ENERGY_CPU_PACKAGE = 'CPU Package',
	ENERGY_GPU = 'GPU Power'
}

export class WindowsSensorInterface extends BaseSensorInterface {
	private _executable: string
	private _options: IWindowsSensorInterfaceOptions

	private _childProcess: ChildProcess | undefined
	// duration of the first measurement that is used to determine the start time
	// (this duration is not included in the measurements)
	private _offsetTime: number | undefined // seconds
	private _startTime: NanoSeconds_BigInt | undefined
	private _stopTime: NanoSeconds_BigInt | undefined

	private cleanExit: ((...args: any[]) => void) | undefined

	constructor(options: IWindowsSensorInterfaceOptions, debugOptions?: {
		startTime: NanoSeconds_BigInt,
		stopTime: NanoSeconds_BigInt,
		offsetTime: number,
		platform?: SupportedPlatforms
	}) {
		super()
		const platform = debugOptions?.platform ?? process.platform
		if (platform !== 'win32') {
			throw new Error('WindowsSensorInterface: This sensor interface can only be used on Windows')
		}
		this._executable = getPlatformSpecificBinaryPath(platform).toPlatformString()
		this._options = options
		
		if (debugOptions !== undefined) {
			this._startTime = debugOptions.startTime,
			this._stopTime = debugOptions.stopTime
			this._offsetTime = debugOptions.offsetTime
			this._couldBeExecuted = true
		}
	}

	type(): SensorInterfaceType {
		return SensorInterfaceType.windows
	}

	executable(): string {
		return this._executable
	}

	async canBeExecuted(): Promise<boolean> {
		return await PermissionHelper.checkWindowsAdminRights()
	}

	async commandLineArgs() {
		return [
			'samplerate=' + this._options.sampleInterval.toString(),
			'filename=' + this._options.outputFilePath
		]
	}

	isRunning(): boolean {
		return this._childProcess?.pid !== undefined && BaseSensorInterface.pidIsRunning(this._childProcess.pid)
	}

	getOutputContent(): string | undefined {
		if (!fs.existsSync(this._options.outputFilePath)) {
			return undefined
		}

		return fs.readFileSync(this._options.outputFilePath).toString()
	}

	async readSensorValues(pid: number): Promise<MetricsDataCollection | undefined> {
		if (!await this.couldBeExecuted()) {
			return undefined
		}
		let tries = 0
		while (this.isRunning() && tries < 10) {
			LoggerHelper.error(
				`Cannot read sensor values, wait for process to exit: ${tries + 1}, try again after 1 second`)
			tries += 1
			await TimeHelper.sleep(1000)
		}

		if (this.startTime === undefined || this.stopTime === undefined) {
			throw new Error('WindowsSensorInterface.readSensorValues: start or stop time could not be determined')
		}
		if (this._offsetTime === undefined) {
			throw new Error('WindowsSensorInterface.readSensorValues: offset time could not be determined')
		}

		const content = this.getOutputContent()
		if (content === undefined){
			return new MetricsDataCollection(
				pid,
				MetricsDataCollectionType.WindowsSensorInterfaceTotalSystem,
				[],
				{
					startTime: this.startTime,
					stopTime: this.stopTime
				}
			)
		}

		const lines = content.split('\n')

		
		const data: WindowsSensorInterfaceMetricsData[] = []
	
		let cpu_energy: MilliJoule_number = 0 as MilliJoule_number
		let gpu_energy: MilliJoule_number = 0 as MilliJoule_number
		const captured = {
			[WindowsSensorInterfaceEvent.ENERGY_CPU_PACKAGE]: false,
			[WindowsSensorInterfaceEvent.ENERGY_GPU]: false
		}
		let lastDuration = this._offsetTime // seconds
	
		// skip first line since the first measurement is used to determine the start time
		for (let i = 1; i < lines.length; i++) {
			if (lines[i] === 'EOF' || lines[i] === '') {
				break
			}
			const values = lines[i].trim().split('|')
			const duration = parseFloat(values[0].replace(/,/g, '.')) / 1e3 // seconds
	
			const delta = duration - lastDuration
	
			for (let col = 1; col < values.length; col++) {
				const valueType = values[col]
				switch (valueType) {
					case WindowsSensorInterfaceEvent.ENERGY_CPU_PACKAGE: {
						if (col + 1 < values.length && values[col + 1] !== undefined) {
							cpu_energy = parseFloat(values[++col].replace(/,/g, '.')) * delta * 1e3 as MilliJoule_number
						}
						captured[WindowsSensorInterfaceEvent.ENERGY_CPU_PACKAGE] = true
					} break
					case WindowsSensorInterfaceEvent.ENERGY_GPU: {
						if (col + 1 < values.length && values[col + 1] !== undefined) {
							gpu_energy = parseFloat(values[++col].replace(/,/g, '.')) * delta * 1e3 as MilliJoule_number
						}
						captured[WindowsSensorInterfaceEvent.ENERGY_GPU] = true
					} break
					default:
						break
				}
			}

			data.push(new WindowsSensorInterfaceMetricsData({
				elapsed_ns: BigInt(Math.round(delta * 1e9)) as NanoSeconds_BigInt, // convert into nano seconds
				timestamp: 
				(this.startTime + BigInt(Math.ceil(duration * 1e9 - this._offsetTime * 1e9))) as NanoSeconds_BigInt,
				cpu_energy:
					captured[WindowsSensorInterfaceEvent.ENERGY_CPU_PACKAGE] ? cpu_energy : 0 as MilliJoule_number,
				ram_energy: 0 as MilliJoule_number,
				gpu_energy: captured[WindowsSensorInterfaceEvent.ENERGY_GPU] ? gpu_energy : 0 as MilliJoule_number,
			}))
			captured[WindowsSensorInterfaceEvent.ENERGY_CPU_PACKAGE] = false
			captured[WindowsSensorInterfaceEvent.ENERGY_GPU] = false
			lastDuration = duration
		}

		return new MetricsDataCollection(
			pid,
			MetricsDataCollectionType.WindowsSensorInterfaceTotalSystem,
			data,
			{
				startTime: this.startTime,
				stopTime: this.stopTime
			}
		)
	}

	get startTime(): NanoSeconds_BigInt | undefined {
		return this._startTime
	}

	get stopTime(): NanoSeconds_BigInt | undefined {
		return this._stopTime
	}

	async startProfiling() {
		if (!await this.couldBeExecuted()) {
			return
		}
		if (fs.existsSync(this._options.outputFilePath)) {
			fs.unlinkSync(this._options.outputFilePath) // remove output file to ensure clean measurements
		}

		this._childProcess = spawn(this._executable, [...await this.commandLineArgs()], {
			detached: true
		})

		this.cleanExit = () => {
			if (this._childProcess) {
				this._childProcess.kill('SIGTERM')
			}
		}

		// capture first measurement to determine start time
		let firstCapture = false
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		const onFirstCapture =  async (data: any) => {
			if (!firstCapture){
				const currentTime = TimeHelper.getCurrentHighResolutionTime()
				const content = data.toString()
				if (!content.startsWith('BEGIN_MEASUREMENT')) {
					LoggerHelper.error('WindowsSensorInterface.startProfiling: Could not capture first measurement, unexpected output:', content)
					return
				}
				firstCapture = true
				const values = content.trim().split(' ')
				const duration = parseFloat(values[1].replace(/,/g, '.')) / 1e3 // seconds
				this._offsetTime = duration
				this._startTime = currentTime

				this._childProcess?.stdout?.removeListener('data', onFirstCapture)
			}
		}
		this._childProcess.stdout?.on('data', onFirstCapture)

		process.on('exit', this.cleanExit) // add event listener to close powermetrics if the parent process exits

		// detach from current node.js process
		this._childProcess.unref()
		await TimeHelper.sleep(1000 + this._options.sampleInterval) // wait to ensure measurements started, since the measurements only starts at full seconds
		// wait until the start time is set (the first measurement is captured)
		return new Promise<void>((resolve) => {
			const interval = setInterval(() => {
				if (this._startTime !== undefined) {
					clearInterval(interval)
					resolve()
				}
			}, 100)
		})
	}

	async stopProfiling() {
		if (!await this.couldBeExecuted()) {
			return
		}
		if (this._childProcess === undefined) {
			return
		}
		await TimeHelper.sleep(1000 + this._options.sampleInterval) // wait to capture last measurement
		this._stopTime = TimeHelper.getCurrentHighResolutionTime()
		this._childProcess.kill('SIGTERM')
		let seconds = 0
		while (this.isRunning()) {
			if (seconds > 10) {
				throw new Error('Waited 10 seconds for powermetrics to shut down, it is still running')
			}
			await TimeHelper.sleep(1000)
			seconds++
		}
		if (this.cleanExit !== undefined) {
			process.removeListener('exit', this.cleanExit) // clean up event listener
		}
	}
}