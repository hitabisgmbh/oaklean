import inspector from 'node:inspector'

import {
	InspectorSessionHelper,
	LoggerHelper,
	MicroSeconds_number,
	TimeHelper
} from '@oaklean/profiler-core'

type TraceEventParams = {
	pid: number
	tid: number
	ts: number
	tts: number
	ph: string
	cat: string
	name: string
	dur: number
	tdur: number
}


export class TraceEventHelper {
	private static _started = false
	private static _profilerStartTime: MicroSeconds_number | undefined = undefined

	/**
	 * Starts a trace event session to capture V8 trace events.
	 */
	private static async startTraceEventSession() {
		if (TraceEventHelper._started) {
			throw new Error('Trace event session already started')
		}
		TraceEventHelper._started = true
		TraceEventHelper._profilerStartTime = undefined
		await TraceEventHelper.post('NodeTracing.start', {
			traceConfig: {
				includedCategories: ['v8'] // config to capture v8's trace events
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static post(message: any, data: any) {
		return new Promise((resolve, reject) => {
			InspectorSessionHelper.session.post(message, data, (err, result) => {
				if (err) {
					reject(new Error(JSON.stringify(err)))
				} else {
					resolve(result)
				}
			})
		})
	}


	/**
	 * Handles the 'dataCollected' event from the NodeTracing domain.
	 * @param chunk - The data chunk containing trace event information.
	 */
	private static onDataCollected(
		chunk: inspector.InspectorNotification<inspector.NodeTracing.DataCollectedEventDataType>
	) {
		for (const event of chunk.params.value as TraceEventParams[]) {
			if (event.pid === process.pid && event.cat === 'v8') {
				if (event.name === 'CpuProfiler::StartProfiling') {
					// captured start event of cpu profiler
					TraceEventHelper._profilerStartTime = event.ts as MicroSeconds_number // store high resolution begin time
				}
			}
		}
	}

	/**
	 * Starts capturing trace events related to CPU profiling.
	 */
	static async startCapturingProfilerTracingEvents() {
		InspectorSessionHelper.session.on(
			'NodeTracing.dataCollected',
			TraceEventHelper.onDataCollected
		)
		await TraceEventHelper.startTraceEventSession() // start trace event capturing
	}

	/**
	 * Stops capturing trace events related to CPU profiling.
	 */
	static async stopTraceEventSession() {
		TraceEventHelper._started = false
		await TraceEventHelper.post('NodeTracing.stop', undefined)
		InspectorSessionHelper.session.removeListener(
			'NodeTracing.dataCollected',
			TraceEventHelper.onDataCollected
		)
	}

	/**
	 * Retrieves the high-resolution timestamp when CPU profiling began.
	 * @returns The high-resolution timestamp in microseconds.
	 * @throws Error if the start time could not be captured after multiple attempts.
	 */
	static async getCPUProfilerBeginTime(): Promise<MicroSeconds_number> {
		let tries = 0
		while (TraceEventHelper._profilerStartTime === undefined && tries < 10) {
			LoggerHelper.error(
				`Cannot capture profiler start time on try: ${
					tries + 1
				}, try again after 1 second`
			)
			tries += 1
			await TimeHelper.sleep(1000)
		}
		if (TraceEventHelper._profilerStartTime === undefined) {
			throw new Error(
				`Could not capture cpu profilers begin time after ${tries} tries, measurements failed`
			)
		}
		return TraceEventHelper._profilerStartTime
	}
}
