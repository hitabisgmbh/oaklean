import * as fs from 'fs'
import { Session } from 'inspector'

import seedrandom from 'seedrandom'
import {
	APP_NAME,
	ProfilerConfig,
	ProjectReport,
	IProjectReportExecutionDetails,
	IProjectReportExecutionDetailsDuringMeasurement,
	TimeHelper,
	NanoSeconds_BigInt,
	MicroSeconds_number,
	ReportKind,
	PermissionHelper,
	LoggerHelper,
	ExecutionDetails,
	PerformanceHelper,
	ExternalResourceHelper,
	RegistryHelper,
	ExportAssetHelper,
	CPUProfileHelper
} from '@oaklean/profiler-core'

import { V8Profiler } from './model/V8Profiler'
import { TraceEventHelper } from './helper/TraceEventHelper'
import { BaseSensorInterface } from './interfaces/BaseSensorInterface'
import { PowerMetricsSensorInterface } from './interfaces/powermetrics/PowerMetricsSensorInterface'
import { PerfSensorInterface } from './interfaces/perf/PerfSensorInterface'
import { WindowsSensorInterface } from './interfaces/windows/WindowsSensorInterface'

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
	exportAssetHelper: ExportAssetHelper
	executionDetails?: IProjectReportExecutionDetailsDuringMeasurement

	private _externalResourceHelper: ExternalResourceHelper
	private _sensorInterface: BaseSensorInterface | undefined
	private _traceEventSession: Session | undefined
	private _profilerStartTime: MicroSeconds_number | undefined

	constructor(
		subOutputDir?: string
	) {
		this.subOutputDir = subOutputDir
		this.config = ProfilerConfig.autoResolve()
		this.loadSensorInterface()
		this._externalResourceHelper = new ExternalResourceHelper(
			this.config.getRootDir()
		)
		this.exportAssetHelper = new ExportAssetHelper(
			this.config.getOutDir().join(this.subOutputDir || '')
		)
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
			case 'windows': {
				const options = config.getSensorInterfaceOptions()
				if (options === undefined) {
					throw new Error('Profiler.getSensorInterface: sensorInterfaceOptions are not defined')
				}
				options.outputFilePath = config.getOutDir().join(options.outputFilePath).toPlatformString()
				return new WindowsSensorInterface(options)
			}
		}
	}

	loadSensorInterface() {
		this._sensorInterface = Profiler.getSensorInterface(this.config)
	}

	static async inject(subOutputDir?: string): Promise<Profiler> {
		const profiler = new Profiler(subOutputDir)

		const title = new Date().getTime().toString()

		const exitResolve = () => resolve('exit')
		const sigIntResolve = () => resolve('SIGINT')
		const sigUsr1Resolve = () => resolve('SIGUSR1')
		const sigUsr2Resolve = () => resolve('SIGUSR2')


		let stopped = false
		async function resolve(origin: string) {
			if (!stopped) {
				stopped = true
				LoggerHelper.log(`(${APP_NAME} Profiler) Finish Measurement, please wait...`)
				await profiler.finish(title)
				process.removeListener('exit', exitResolve)
				process.removeListener('SIGINT', sigIntResolve)
				process.removeListener('SIGUSR1', sigUsr1Resolve)
				process.removeListener('SIGUSR2', sigUsr2Resolve)
				if (origin !== 'exit') {
					process.exit()
				}
			}
		}

		LoggerHelper.log(`(${APP_NAME} Profiler) Measurement started`)
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
				if (event.pid === process.pid && event.cat === 'v8') {
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
			LoggerHelper.error(`Cannot capture profiler start time on try: ${tries + 1}, try again after 1 second`)
			tries += 1
			await TimeHelper.sleep(1000)
		}
		if (this._profilerStartTime === undefined) {
			throw new Error(`Could not capture cpu profilers begin time after ${tries} tries, measurements failed`)
		}
		return this._profilerStartTime
	}

	async start(title: string, executionDetails?: IProjectReportExecutionDetailsDuringMeasurement) {
		const performance = new PerformanceHelper()
		performance.start('Profiler.start')

		const outFileReport = this.exportAssetHelper.outputReportPath(title)
		const outDir = outFileReport.dirName()

		performance.start('Profiler.start.createOutDir')
		if (!fs.existsSync(outDir.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(outDir)
		}
		performance.stop('Profiler.start.createOutDir')

		performance.start('Profiler.start.seedRandom')
		const mathRandomSeed = this.config.getSeedForMathRandom()
		if (mathRandomSeed) {
			seedrandom(mathRandomSeed, { global: true })
		}
		performance.stop('Profiler.start.seedRandom')

		if (executionDetails) {
			this.executionDetails = executionDetails
		} else {
			performance.start('Profiler.start.resolveExecutionDetails')
			this.executionDetails = await ExecutionDetails.resolveExecutionDetails()
			performance.stop('Profiler.start.resolveExecutionDetails')
		}

		performance.start('Profiler.start.sensorInterface.couldBeExecuted')
		if (this._sensorInterface !== undefined && !await this._sensorInterface.couldBeExecuted()) {
			// remove sensor interface from execution details since it cannot be executed
			this.executionDetails.runTimeOptions.sensorInterface = undefined
			LoggerHelper.warn(`(${APP_NAME} Profiler) Warning: ` + 
				'Sensor Interface can not be executed, no energy measurements will be collected')
		}
		performance.stop('Profiler.start.sensorInterface.couldBeExecuted')

		performance.start('Profiler.start.sensorInterface.startProfiling')
		await this._sensorInterface?.startProfiling()
		performance.stop('Profiler.start.sensorInterface.startProfiling')

		performance.start('Profiler.start.V8Profiler.setGenerateType')
		V8Profiler.setGenerateType(1) // must be set to generate new cpuprofile format
		performance.stop('Profiler.start.V8Profiler.setGenerateType')

		performance.start('Profiler.start.getV8CPUSamplingInterval')
		V8Profiler.setSamplingInterval(this.config.getV8CPUSamplingInterval()) // sets the sampling interval in microseconds
		performance.stop('Profiler.start.getV8CPUSamplingInterval')

		performance.start('Profiler.start.startCapturingProfilerTracingEvents')
		await this.startCapturingProfilerTracingEvents()
		performance.stop('Profiler.start.startCapturingProfilerTracingEvents')

		performance.start('Profiler.start.externalResourceHelper.connect')
		await this._externalResourceHelper.connect()
		await this._externalResourceHelper.listen()
		performance.stop('Profiler.start.externalResourceHelper.connect')

		// wait for the first sensor interface measurement
		if (this._sensorInterface !== undefined && await this._sensorInterface.couldBeExecuted()) {
			await this._sensorInterface?.measurementStarted()
		}

		// title - handle to stop profile again
		// recsampels(boolean) - record samples, if false no cpu times will be captured
		performance.start('Profiler.start.V8Profiler.startProfiling')
		V8Profiler.startProfiling(title, true)
		performance.stop('Profiler.start.V8Profiler.startProfiling')
		performance.stop('Profiler.start')
		performance.printReport('Profiler.start')
		performance.exportAndSum(this.exportAssetHelper.outputPerformancePath())
	}

	async finish(title: string, highResolutionStopTime?: NanoSeconds_BigInt): Promise<ProjectReport> {
		const highResolutionStopTimeToUse = highResolutionStopTime !== undefined
			? highResolutionStopTime.toString()
			: TimeHelper.getCurrentHighResolutionTime().toString()
		
		const performance = new PerformanceHelper()
		
		performance.start('Profiler.finish')
		if (this.executionDetails === undefined) {
			throw new Error('Profiler.finish: Profiler was not started yet')
		}

		performance.start('Profiler.finish.stopProfiling')
		const profile = V8Profiler.stopProfiling(title)
		performance.stop('Profiler.finish.stopProfiling')

		performance.start('Profiler.finish.stopCapturingProfilerTracingEvents')
		this.stopCapturingProfilerTracingEvents()
		performance.stop('Profiler.finish.stopCapturingProfilerTracingEvents')

		performance.start('Profiler.finish.sensorInterface.stopProfiling')
		await this._sensorInterface?.stopProfiling()
		performance.stop('Profiler.finish.sensorInterface.stopProfiling')

		const CPUProfilerBeginTime = BigInt(await this.getCPUProfilerBeginTime()) * BigInt(1000) as NanoSeconds_BigInt
		const highResolutionBeginTimeToUse = CPUProfilerBeginTime.toString()

		const cpuProfile = {
			nodes: profile.nodes,
			startTime: profile.startTime,
			endTime: profile.endTime,
			samples: profile.samples,
			timeDeltas: profile.timeDeltas
		}
		const outFileCPUProfile = this.exportAssetHelper.outputCPUProfilePath(title)
		const outFileExternalResourceHelper = this.exportAssetHelper.outputExternalResourceHelperPath(title)
		const outFileReport = this.exportAssetHelper.outputReportPath(title)
		const outFileMetricsDataCollection = this.exportAssetHelper.outputMetricsDataCollectionPath(title)
		if (this.config.shouldExportV8Profile()) {
			performance.start('Profiler.finish.exportV8Profile')
			await CPUProfileHelper.storeToFile(
				cpuProfile,
				outFileCPUProfile,
			)
			performance.stop('Profiler.finish.exportV8Profile')
		}
		performance.start('Profiler.finish.sensorInterface.readSensorValues')
		const metricsDataCollection = await this._sensorInterface?.readSensorValues(process.pid)
		performance.stop('Profiler.finish.sensorInterface.readSensorValues')

		const executionDetailsFull: IProjectReportExecutionDetails = {
			...this.executionDetails,
			highResolutionBeginTime: highResolutionBeginTimeToUse,
			highResolutionStopTime: highResolutionStopTimeToUse
		}

		const rootDir = this.config.getRootDir()
		const report = new ProjectReport(executionDetailsFull, ReportKind.measurement)
		if (this.config.shouldExportSensorInterfaceData()) {
			if (metricsDataCollection !== undefined) {
				performance.start('Profiler.finish.exportMetricsDataCollection')
				metricsDataCollection.storeToFile(outFileMetricsDataCollection)
				performance.stop('Profiler.finish.exportMetricsDataCollection')
			}
		}

		// load all script sources from inspector
		performance.start('Profiler.finish.externalResourceHelper.fillSourceMapsFromCPUProfile')
		await this._externalResourceHelper.fillSourceMapsFromCPUProfile(profile)
		performance.stop('Profiler.finish.externalResourceHelper.fillSourceMapsFromCPUProfile')
		
		performance.start('Profiler.finish.externalResourceHelper.disconnect')
		await this._externalResourceHelper.disconnect()
		performance.stop('Profiler.finish.externalResourceHelper.disconnect')

		if (this.config.shouldExportV8Profile()) {
			performance.start('Profiler.finish.exportExternalResourceHelper')
			this._externalResourceHelper.storeToFile(
				outFileExternalResourceHelper,
				'pretty-json'
			)
			performance.stop('Profiler.finish.exportExternalResourceHelper')
		}

		performance.start('Profiler.finish.insertCPUProfile')
		await report.insertCPUProfile(
			rootDir,
			cpuProfile,
			this._externalResourceHelper,
			metricsDataCollection
		)
		performance.stop('Profiler.finish.insertCPUProfile')

		performance.start('Profiler.finish.trackUncommittedFiles')
		report.trackUncommittedFiles(rootDir, this._externalResourceHelper)
		performance.stop('Profiler.finish.trackUncommittedFiles')

		if (this.config.shouldExportV8Profile()) {
			performance.start('Profiler.finish.exportExternalResourceHelper')
			this._externalResourceHelper.storeToFile(
				outFileExternalResourceHelper,
				'pretty-json'
			)
			performance.stop('Profiler.finish.exportExternalResourceHelper')
		}

		if (this.config.shouldExportReport()) {
			performance.start('Profiler.finish.exportReport')
			report.storeToFile(outFileReport, 'bin', this.config)
			performance.stop('Profiler.finish.exportReport')
		}

		if (await report.shouldBeStoredInRegistry()) {
			await RegistryHelper.uploadToRegistry(report, this.config)
		}
		performance.stop('Profiler.finish')
		performance.printReport('Profiler.finish')
		performance.exportAndSum(this.exportAssetHelper.outputPerformancePath())

		return report
	}
}
