import * as fs from 'fs'
import { Session } from 'inspector'

import seedrandom from 'seedrandom'
import {
	UnifiedPath,
	ProfilerConfig,
	ProjectReport,
	IProjectReportExecutionDetails,
	JestAdapter,
	TimeHelper,
	NanoSeconds_BigInt,
	MicroSeconds_number,
	ReportKind,
	PermissionHelper
} from '@oaklean/profiler-core'
import { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'

import { V8Profiler } from './model/V8Profiler'
import { TraceEventHelper } from './helper/TraceEventHelper'
import { BaseSensorInterface } from './interfaces/BaseSensorInterface'
import { PowerMetricsSensorInterface } from './interfaces/powermetrics/PowerMetricsSensorInterface'
import { PerfSensorInterface } from './interfaces/perf/PerfSensorInterface'

export type TransformerAdapter = 'ts-jest'

export type ProfilerOptions = {
	transformerAdapter?: TransformerAdapter
	jestAdapter: {
		config: JestEnvironmentConfig,
		context: EnvironmentContext
	}
}

interface TraceEventParams {
	pid: number,
	tid: number,
	ts: number,
	tts: number,
	ph: string,
	cat: string,
	name: string,
	dur: number
	tdur: number
}

export class Profiler {
	subOutputDir: string | undefined
	config: ProfilerConfig
	options?: ProfilerOptions
	executionDetails?: IProjectReportExecutionDetails

	private _sensorInterface: BaseSensorInterface | undefined
	private _traceEventSession: Session | undefined
	private _profilerStartTime: MicroSeconds_number | undefined

	constructor(
		subOutputDir?: string,
		options?: ProfilerOptions
	) {
		this.subOutputDir = subOutputDir
		this.config = ProfilerConfig.autoResolve()
		this.options = options
		this.loadSensorInterface()
	}

	static getSensorInterface(config: ProfilerConfig) {
		const sensorInterfaceType = config.getSensorInterfaceType()
		switch (sensorInterfaceType) {
			case 'powermetrics': {
				const options = config.getSensorInterfaceOptions()
				if (options === undefined) {
					throw new Error('Profiler.getSensorInterface: sensorInterfaceOptions are not defined')
				}
				options.outputFilePath = config.getOutDir().join(options.outputFilePath).toPlatformString()
				return new PowerMetricsSensorInterface(options)
			}
			case 'perf': {
				const options = config.getSensorInterfaceOptions()
				if (options === undefined) {
					throw new Error('Profiler.getSensorInterface: sensorInterfaceOptions are not defined')
				}
				options.outputFilePath = config.getOutDir().join(options.outputFilePath).toPlatformString()
				return new PerfSensorInterface(options)
			}
		}
	}

	loadSensorInterface() {
		this._sensorInterface = Profiler.getSensorInterface(this.config)
	}

	static async inject(profileName: string, subOutputDir?: string): Promise<Profiler> {
		const profiler = new Profiler(subOutputDir)

		const title = new Date().getTime().toString()

		const exitResolve = () => resolve('exit')
		const sigIntResolve = () => resolve('SIGINT')
		const sigUsr1Resolve = () => resolve('SIGUSR1')
		const sigUsr2Resolve = () => resolve('SIGUSR2')


		let stopped = false
		async function resolve(origin: string) {
			if (!stopped) {
				await profiler.finish(title)
				stopped = true
			}
			process.removeListener('exit', exitResolve)
			process.removeListener('SIGINT', sigIntResolve)
			process.removeListener('SIGUSR1', sigUsr1Resolve)
			process.removeListener('SIGUSR2', sigUsr2Resolve)
			if (origin !== 'exit') {
				process.exit()
			}
		}

		await profiler.start(title)

		process.on('exit', exitResolve)

		// //catches ctrl+c event
		process.on('SIGINT', sigIntResolve)

		// // catches "kill pid" (for example: nodemon restart)
		process.on('SIGUSR1', sigUsr1Resolve)
		process.on('SIGUSR2', sigUsr2Resolve)

		return profiler
	}

	async startCapturingProfilerTracingEvents() {
		if (this._traceEventSession !== undefined) {
			throw new Error('startCapturingProfilerTracingEvents: Trace Event Session should not already be defined')
		}
		const session = new Session()
		this._traceEventSession = session
		session.connect()
		session.on('NodeTracing.dataCollected', (chunk) => {
			for (const event of (chunk.params.value as TraceEventParams[])) {
				if (event.pid === process.pid && event.cat === 'v8' ) {
					if (event.name === 'CpuProfiler::StartProfiling') { // captured start event of cpu profiler
						this._profilerStartTime = event.ts as MicroSeconds_number // store high resolution begin time
					}
				}
			}
		})
		const traceConfig = { includedCategories: ['v8'] } // config to capture v8's trace events
		await TraceEventHelper.post(session, 'NodeTracing.start', { traceConfig }) // start trace event capturing
	}

	async stopCapturingProfilerTracingEvents() {
		if (this._traceEventSession === undefined) {
			throw new Error('stopCapturingProfilerTracingEvents: Trace Event Session should be defined')
		}
		await TraceEventHelper.post(this._traceEventSession, 'NodeTracing.stop', undefined)
		this._traceEventSession.disconnect()
		this._traceEventSession = undefined
	}

	async getCPUProfilerBeginTime(): Promise<MicroSeconds_number> {
		let tries = 0
		while (this._profilerStartTime === undefined && tries < 10) {
			console.error(`Cannot capture profiler start time on try: ${tries + 1}, try again after 1 second`)
			tries += 1
			await TimeHelper.sleep(1000)
		}
		if (this._profilerStartTime === undefined) {
			throw new Error(`Could not capture cpu profilers begin time after ${tries} tries, measurements failed`)
		}
		return this._profilerStartTime
	}

	async start(title: string, executionDetails?: IProjectReportExecutionDetails) {
		const mathRandomSeed = this.config.getSeedForMathRandom()
		if (mathRandomSeed) {
			seedrandom(mathRandomSeed, { global: true })
		}
		
		if (executionDetails) {
			this.executionDetails = executionDetails
		} else {
			this.executionDetails = await ProjectReport.resolveExecutionDetails()
		}
		V8Profiler.setGenerateType(1) // must be set to generate new cpuprofile format
		V8Profiler.setSamplingInterval(this.config.getV8CPUSamplingInterval()) // sets the sampling interval in microseconds
		await this.startCapturingProfilerTracingEvents()
		await this._sensorInterface?.startProfiling()

		// title - handle to stop profile again
		// recsampels(boolean) - record samples, if false no cpu times will be captured
		V8Profiler.startProfiling(title, true)
	}

	outputDir(): UnifiedPath {
		return this.config.getOutDir().join(this.subOutputDir || '')
	}

	outputReportPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.oak`)
	}

	outputMetricCollectionPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.mcollection`)
	}

	outputProfilePath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}.cpuprofile`)
	}

	async finish(title: string, highResolutionStopTime?: NanoSeconds_BigInt): Promise<ProjectReport> {
		if (this.executionDetails === undefined) {
			throw new Error('Profiler.finish: Profiler was not started yet')
		}
		if (highResolutionStopTime !== undefined) {
			this.executionDetails.highResolutionStopTime = highResolutionStopTime.toString()
		}

		const profile = V8Profiler.stopProfiling(title)
		this.stopCapturingProfilerTracingEvents()
		await this._sensorInterface?.stopProfiling()
		const CPUProfilerBeginTime = BigInt(await this.getCPUProfilerBeginTime()) * BigInt(1000) as NanoSeconds_BigInt
		this.executionDetails.highResolutionBeginTime = CPUProfilerBeginTime.toString()

		const exportData = {
			nodes: profile.nodes,
			startTime: profile.startTime,
			endTime: profile.endTime,
			samples: profile.samples,
			timeDeltas: profile.timeDeltas
		}
		let transformerAdapter = undefined
		if (this.options?.transformerAdapter === 'ts-jest') {
			if (!this.options.jestAdapter.config || !this.options.jestAdapter.context) {
				throw new Error('Please provide the JestEnvironmentConfig and EnvironmentContext in the profiler options at options.jestAdapter')
			}
			transformerAdapter = new JestAdapter(
				this.options.jestAdapter.config,
				this.options.jestAdapter.context
			)
			if (!fs.existsSync(this.outputDir().toPlatformString())) {
				PermissionHelper.mkdirRecursivelyWithUserPermission(this.outputDir())
			}
			PermissionHelper.writeFileWithUserPermission(
				this.outputDir().join('jest.config').toPlatformString(),
				JSON.stringify({
					config: this.options.jestAdapter.config,
					context: this.options.jestAdapter.context
				})
			)
		}
		const outFileCPUProfile = this.outputProfilePath(title)
		const outFileReport = this.outputReportPath(title)
		const outFileMetricCollection = this.outputMetricCollectionPath(title)
		const outDir = outFileReport.dirName()
		if (!fs.existsSync(outDir.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(outDir)
		}
		if (this.config.shouldExportV8Profile()) {
			PermissionHelper.writeFileWithUserPermission(
				outFileCPUProfile.toPlatformString(),
				JSON.stringify(exportData, null, 2),
			)
		}
		const metricsDataCollection = await this._sensorInterface?.readSensorValues(process.pid)

		const rootDir = this.config.getRootDir()
		const report = new ProjectReport(this.executionDetails, ReportKind.measurement)
		if (this.config.shouldExportSensorInterfaceData()) {
			if (metricsDataCollection !== undefined) {
				metricsDataCollection.storeToFile(outFileMetricCollection)
			}
		}

		await report.insertCPUProfile(
			rootDir,
			profile,
			transformerAdapter,
			metricsDataCollection
		)

		await report.trackUncommittedFiles(rootDir)

		if (this.config.shouldExportReport()) {
			report.storeToFile(outFileReport, 'bin', this.config)
		}

		if (await report.shouldBeStoredInRegistry()) {
			await report.uploadToRegistry(this.config)
		}
		return report
	}
}
