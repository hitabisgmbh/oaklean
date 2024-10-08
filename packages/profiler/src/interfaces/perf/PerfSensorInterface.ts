import * as fs from 'fs'
import { ChildProcess, spawn, execSync } from 'child_process'

import {
	MetricsDataCollection,
	PerfMetricsData,
	IPerfSensorInterfaceOptions,
	TimeHelper,
	NanoSeconds_BigInt,
	MetricsDataCollectionType,
	MilliJoule_number,
	SensorInterfaceType
} from '@oaklean/profiler-core'

import { BaseSensorInterface } from '../BaseSensorInterface'

/**
 * This SensorInterface uses the data provided by the perf command line tool.
 * This Provider can only be used on Linux with Perf installed and a CPU that supports RAPL
 * 
 * Man Page to perf:
 * https://linux.die.net/man/1/perf
 */

export enum PerfEvent {
	ENERGY_CORES = 'power/energy-cores/',
	ENERGY_RAM = 'power/energy-ram/',
}

export type MeasurementTypeAvailable = {
	[PerfEvent.ENERGY_CORES]: boolean,
	[PerfEvent.ENERGY_RAM]: boolean
}

export class PerfSensorInterface extends BaseSensorInterface {
	private _executable: string
	private _options: IPerfSensorInterfaceOptions

	private _childProcess: ChildProcess | undefined
	private _startTime: NanoSeconds_BigInt | undefined
	private _stopTime: NanoSeconds_BigInt | undefined

	private _availableMeasurementTypes: MeasurementTypeAvailable | undefined

	private cleanExit: ((...args: any[]) => void) | undefined

	constructor(options: IPerfSensorInterfaceOptions, debugOptions?: {
		startTime: NanoSeconds_BigInt,
		stopTime: NanoSeconds_BigInt
	}) {
		super()
		this._executable = 'perf'
		this._options = options
		
		if (debugOptions !== undefined) {
			this._startTime = debugOptions.startTime,
			this._stopTime = debugOptions.stopTime
		}
	}

	type(): SensorInterfaceType {
		return SensorInterfaceType.perf
	}

	async commandLineArgs() {
		const availableMeasurementTypes = await this.availableMeasurementTypes()
		return [
			'stat',
			...(availableMeasurementTypes[PerfEvent.ENERGY_CORES] ? ['-e', PerfEvent.ENERGY_CORES] : []),
			...(availableMeasurementTypes[PerfEvent.ENERGY_RAM] ? ['-e', PerfEvent.ENERGY_RAM] : []),
			'-x', '\'|\'',
			'-I', this._options.sampleInterval.toString(),
			'-o',
			this._options.outputFilePath
		]
	}

	async canBeExecuted(): Promise<boolean> {
		const availableMeasurementTypes = await this.availableMeasurementTypes()

		return availableMeasurementTypes[PerfEvent.ENERGY_CORES] ||
			availableMeasurementTypes[PerfEvent.ENERGY_RAM]
	}
	
	async availableMeasurementTypes(): Promise<MeasurementTypeAvailable> {
		if (this._availableMeasurementTypes === undefined) {
			this._availableMeasurementTypes = {
				[PerfEvent.ENERGY_CORES]: await this.checkEventAvailability(PerfEvent.ENERGY_CORES),
				[PerfEvent.ENERGY_RAM]: await this.checkEventAvailability(PerfEvent.ENERGY_RAM),
			}
		}
		return this._availableMeasurementTypes
	}
	
	checkEventAvailability(eventName: string): Promise<boolean> {
		return new Promise((resolve) => {
			try {
				const childProcess = spawn(
					this._executable + ' stat -e ' + eventName + ' -- sleep 0.001',
					{
						detached: false,
						stdio: 'pipe',
						shell: true
					})
				childProcess.on('close', (code: number) => {
					if (code === 0) {
						resolve(true)
					} else {
						resolve(false)
					}
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
			const result = execSync('pgrep -ix perf', { encoding: 'utf-8' })
			return result.trim().split('\n')
		} catch (error) {
			return []
		}
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
			console.error(`Cannot read sensor values, wait for process to exit: ${tries + 1}, try again after 1 second`)
			tries += 1
			await TimeHelper.sleep(1000)
		}

		if (this.startTime === undefined || this.stopTime === undefined) {
			throw new Error('PerfSensorInterface.readSensorValues: start or stop time could not be determined')
		}

		const content = this.getOutputContent()
		if (content === undefined){
			return new MetricsDataCollection(
				pid,
				MetricsDataCollectionType.PerfTotalSystem,
				[],
				{
					startTime: this.startTime,
					stopTime: this.stopTime
				}
			)
		}

		const lines = content.split('\n')

		let lastDuration = 0 // seconds
		let cpu_energy: MilliJoule_number = 0 as MilliJoule_number
		let ram_energy: MilliJoule_number = 0 as MilliJoule_number
		const data: PerfMetricsData[] = []

		const availableMeasurementTypes = (await this.availableMeasurementTypes())

		const captured = {
			[PerfEvent.ENERGY_CORES]: false,
			[PerfEvent.ENERGY_RAM]: false
		}
		for (let i = 2; i < lines.length; i++) {
			if (lines[i] === '') {
				break
			}
			const values = lines[i].trim().replace(/'/g, '').split('|')
			const duration = parseFloat(values[0].replace(/,/g, '.')) // seconds
			const joules = parseFloat(values[1].replace(/,/g, '.'))
			const type = values[3]

			/**
			 * power/energy-cores/ and power/ram/ values come alternating like this:
			 * 
			 * 0.001105752|0,01|Joules|power/energy-cores/|1127122|100,00||
			 * 0.001105752|0,00|Joules|power/energy-ram/|1127583|100,00||
			 * 0.002236542|0,01|Joules|power/energy-cores/|1139557|100,00||
			 * 0.002236542|0,00|Joules|power/energy-ram/|1139006|100,00||
			 *  
			 */
			switch (type) {
				case PerfEvent.ENERGY_CORES:
					cpu_energy = joules * 1e3 as MilliJoule_number
					captured[PerfEvent.ENERGY_CORES] = true
					break
				case PerfEvent.ENERGY_RAM:
					ram_energy = joules * 1e3 as MilliJoule_number
					captured[PerfEvent.ENERGY_RAM] = true
					break
				default:
					break
			}

			if (
				captured[PerfEvent.ENERGY_CORES] === availableMeasurementTypes[PerfEvent.ENERGY_CORES] &&
				captured[PerfEvent.ENERGY_RAM] === availableMeasurementTypes[PerfEvent.ENERGY_RAM]
			) {
				data.push(new PerfMetricsData({
					elapsed_ns: BigInt(Math.round((duration - lastDuration) * 1e9)) as NanoSeconds_BigInt, // convert into nano seconds
					timestamp: (this.startTime + BigInt(Math.ceil(duration * 1e9))) as NanoSeconds_BigInt,
					cpu_energy: cpu_energy,
					ram_energy: ram_energy,
				}))
				lastDuration = duration
				captured[PerfEvent.ENERGY_CORES] = false
				captured[PerfEvent.ENERGY_RAM] = false
			}
		}

		return new MetricsDataCollection(
			pid,
			MetricsDataCollectionType.PerfTotalSystem,
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
		if (PerfSensorInterface.runningInstances().length > 0) {
			throw new Error('PerfSensorInterface.startProfiling: Perf instance already running, close it before taking any measurements')
		}

		this._startTime = TimeHelper.getCurrentHighResolutionTime()
		this._childProcess = spawn(this._executable, [...await this.commandLineArgs()], {
			detached: true
		})

		this.cleanExit = () => {
			if (this._childProcess) {
				this._childProcess.kill('SIGTERM')
			}
		}

		process.on('exit', this.cleanExit) // add event listener to close perf if the parent process exits

		// detach from current node.js process
		this._childProcess.unref()
		await TimeHelper.sleep(1000 + this._options.sampleInterval) // wait to ensure measurements started, since the measurements only starts at full seconds
	}

	async stopProfiling() {
		if (!await this.couldBeExecuted()) {
			return
		}
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
				throw new Error('Waited 10 seconds for perf to shut down, it is still running')
			}
			await TimeHelper.sleep(1000)
			seconds++
		}
		if (this.cleanExit !== undefined) {
			process.removeListener('exit', this.cleanExit) // clean up event listener
		}
	}
}