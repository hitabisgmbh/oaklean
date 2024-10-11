import * as fs from 'fs'

import {
	Profiler,
	PerfSensorInterface
} from '@oaklean/profiler'
import {
	ProfilerConfig,
	APP_NAME,
	SensorInterfaceType,
	LoggerHelper
} from '@oaklean/profiler-core'
import { PerfEvent } from '@oaklean/profiler/dist/src/interfaces/perf/PerfSensorInterface'

export default async function () {
	if (!process.env.ENABLE_MEASUREMENTS) {
		return
	}
	LoggerHelper.log(`\n(${APP_NAME} Profiler) Clean up Measurements`)
	const profilerConfig = ProfilerConfig.autoResolve()
	const outDir = profilerConfig.getOutDir().join('jest')

	LoggerHelper.log(`(${APP_NAME} Profiler) V8 sample rate: ${profilerConfig.getV8CPUSamplingInterval()}ms`)
	const sensorInterfaceOptions = profilerConfig.getSensorInterfaceOptions()
	if (sensorInterfaceOptions !== undefined) {
		LoggerHelper.log(`(${APP_NAME} Profiler) Using SensorInterface: `, profilerConfig.getSensorInterfaceType())
		LoggerHelper.log(
			`(${APP_NAME} Profiler) SensorInterface Sample Interval: ${sensorInterfaceOptions.sampleInterval}ms`
		)

		const sensorInterface = Profiler.getSensorInterface(profilerConfig)
		if (sensorInterface !== undefined) {
			if (await sensorInterface.canBeExecuted() === false) {
				LoggerHelper.error(
					`(${APP_NAME} Profiler) Sensor Interface cannot be executed with these permissions`
				)
			} else {
				if (sensorInterface.type() === SensorInterfaceType.perf) {
					const availableMeasurementTypes = await (
						sensorInterface as PerfSensorInterface).availableMeasurementTypes()
					LoggerHelper.log(
						`(${APP_NAME} Profiler) Measure CPU Energy: ` +
						`${availableMeasurementTypes[PerfEvent.ENERGY_CORES]}`
					)
					LoggerHelper.log(
						`(${APP_NAME} Profiler) Measure RAM Energy: ` +
						`${availableMeasurementTypes[PerfEvent.ENERGY_RAM]}`
					)
				}
			}
		} else {
			LoggerHelper.log(`(${APP_NAME} Profiler) Something went wrong loading the SensorInterface`)
		}

	} else {
		LoggerHelper.log(
			`(${APP_NAME} Profiler) no SensorInterface configured ` +
			'(no energy measurements will be collected, only cpu time)'
		)
	}

	if (fs.existsSync(outDir.toString())) {
		fs.rmSync(outDir.toString(), { recursive: true })
	}
}
