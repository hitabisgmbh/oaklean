import * as fs from 'fs'
import { ChildProcess, spawn, execSync } from 'child_process'

import plist from 'plist'
import {
	MetricsDataCollection,
	PowerMetricsData,
	IPowerMetricsOutputFormat,
	IPowerMetricsSensorInterfaceOptions,
	TimeHelper,
	NanoSeconds_BigInt,
	MetricsDataCollectionType,
	SensorInterfaceType
} from '@oaklean/profiler-core'

import { BaseSensorInterface } from '../BaseSensorInterface'

/**
 * This SensorInterface uses the data provided by the powermetrics command line tool.
 * This Provider can only be used on Mac OS
 * 
 * Man Page to powermetrics:
 * https://www.unix.com/man-page/osx/1/powermetrics/
 */


export class PowerMetricsSensorInterface extends BaseSensorInterface {
	private _executable: string
	private _options: IPowerMetricsSensorInterfaceOptions
	private _commandLineArgs: string[]

	private _childProcess: ChildProcess | undefined
	private _startTime: NanoSeconds_BigInt | undefined
	private _stopTime: NanoSeconds_BigInt | undefined

	private cleanExit: ((...args: any[]) => void) | undefined

	constructor(options: IPowerMetricsSensorInterfaceOptions, debugOptions?: {
		startTime: NanoSeconds_BigInt,
		stopTime: NanoSeconds_BigInt
	}) {
		super()
		this._executable = 'powermetrics'
		this._options = options
		this._commandLineArgs = [
			'--sample-rate', this._options.sampleInterval.toString(),
			'--buffer-size', '0',
			'--show-process-energy',
			'-f',
			'plist',
			'-o',
			this._options.outputFilePath
		]
		if (debugOptions !== undefined) {
			this._startTime = debugOptions.startTime,
			this._stopTime = debugOptions.stopTime
		}
	}

	type(): SensorInterfaceType {
		return SensorInterfaceType.powermetrics
	}

	canBeExecuted(): Promise<boolean> {
		return new Promise((resolve) => {
			try {
				const childProcess = spawn(this._executable, {
					detached: false,
					stdio: 'pipe'
				})
				let isExecutable = false

				childProcess.on('error', () => {
					resolve(false)
				})

				childProcess.stderr.on('data', () => {
					childProcess.kill('SIGTERM')
					isExecutable = false
				})

				childProcess.stdout.on('data', () => {
					childProcess.kill('SIGTERM')
					isExecutable = true
				})

				childProcess.on('exit', () => {
					resolve(isExecutable)
				})
			} catch {
				resolve(false)
			}
		})
	}

	isRunning(): boolean {
		return this._childProcess?.pid !== undefined && BaseSensorInterface.pidIsRunning(this._childProcess.pid)
	}

	static runningInstances(): string[] {
		try {
			const result = execSync('pgrep -ix powermetrics', { encoding: 'utf-8' })
			return result.trim().split('\n')
		} catch (error) {
			return []
		}
	}

	async readSensorValues(pid: number): Promise<MetricsDataCollection> {
		let tries = 0
		while (this.isRunning() && tries < 10) {
			console.error(`Cannot read sensor values, wait for process to exit: ${tries + 1}, try again after 1 second`)
			tries += 1
			await TimeHelper.sleep(1000)
		}

		if (this.startTime === undefined || this.stopTime === undefined) {
			throw new Error('PowerMetricsSensorInterface.readSensorValues: start or stop time could not be determined')
		}

		if (!fs.existsSync(this._options.outputFilePath) || !(await this.canBeExecuted())){
			return new MetricsDataCollection(
				pid,
				MetricsDataCollectionType.PowerMetricsPerProcess,
				[],
				{
					startTime: this.startTime,
					stopTime: this.stopTime
				}
			)
		}

		const content = fs.readFileSync(this._options.outputFilePath).toString()
		const contents = content.split('\x00')

		const data = contents.map(
			(content: string) => new PowerMetricsData(plist.parse(content) as unknown as IPowerMetricsOutputFormat)
		)

		return new MetricsDataCollection(
			pid,
			MetricsDataCollectionType.PowerMetricsPerProcess,
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
		if (fs.existsSync(this._options.outputFilePath)) {
			fs.unlinkSync(this._options.outputFilePath) // remove output file to ensure clean measurements
		}
		if (PowerMetricsSensorInterface.runningInstances().length > 0) {
			throw new Error('PowerMetricsSensorInterface.startProfiling: PowerMetrics instance already running, close it before taking any measurements')
		}

		this._startTime = TimeHelper.getCurrentHighResolutionTime()
		this._childProcess = spawn(this._executable, [...this._commandLineArgs], {
			detached: true
		})

		this.cleanExit = () => {
			if (this._childProcess) {
				this._childProcess.kill('SIGTERM')
			}
		}

		process.on('exit', this.cleanExit) // add event listener to close powermetrics if the parent process exits

		// detach from current node.js process
		this._childProcess.unref()
		await TimeHelper.sleep(1000 + this._options.sampleInterval) // wait to ensure measurements started, since the measurements only starts at full seconds
	}

	async stopProfiling() {
		if (this._childProcess === undefined) {
			return
		}
		await TimeHelper.sleep(1000 + this._options.sampleInterval) // wait to capture last measurement
		this._childProcess.kill('SIGIO') // flush all buffered output
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