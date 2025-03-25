import * as fs from 'fs'

import {
	Profiler,
	PerfSensorInterface
} from '@oaklean/profiler'
import {
	ProfilerConfig,
	APP_NAME,
	SensorInterfaceType,
	LoggerHelper,
	PerformanceHelper
} from '@oaklean/profiler-core'
import { PerfEvent } from '@oaklean/profiler/dist/src/interfaces/perf/PerfSensorInterface'

import {
	ENABLE_MEASUREMENTS
} from './constants'

export default async function () {
	if (!ENABLE_MEASUREMENTS) {
		return
	}
	const performance = new PerformanceHelper()
	performance.start('jestEnv.setup')
	LoggerHelper.log(`\n(${APP_NAME} Profiler) Clean up Measurements`)
	performance.start('jestEnv.setup.resolveConfig')
	const profilerConfig = ProfilerConfig.autoResolve()
	performance.stop('jestEnv.setup.resolveConfig')
	const outDir = profilerConfig.getOutDir().join('jest')

	LoggerHelper.log(`(${APP_NAME} Profiler) V8 sample rate: ${profilerConfig.getV8CPUSamplingInterval()}ms`)
	performance.stop('jestEnv.setup.getSensorInterfaceOptions')
	const sensorInterfaceOptions = profilerConfig.getSensorInterfaceOptions()
	performance.stop('jestEnv.setup.getSensorInterfaceOptions')
	if (sensorInterfaceOptions !== undefined) {
		LoggerHelper.log(`(${APP_NAME} Profiler) Using SensorInterface: `, profilerConfig.getSensorInterfaceType())
		LoggerHelper.log(
			`(${APP_NAME} Profiler) SensorInterface Sample Interval: ${sensorInterfaceOptions.sampleInterval}ms`
		)

		performance.start('jestEnv.setup.Profiler.getSensorInterface')
		const sensorInterface = Profiler.getSensorInterface(profilerConfig)
		performance.stop('jestEnv.setup.Profiler.getSensorInterface')
		if (sensorInterface !== undefined) {
			performance.start('jestEnv.setup.sensorInterface.canBeExecuted')
			const canBeExecuted = await sensorInterface.canBeExecuted()
			performance.stop('jestEnv.setup.sensorInterface.canBeExecuted')
			if (canBeExecuted === false) {
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

	performance.start('jestEnv.setup.clearOutDir')
	if (fs.existsSync(outDir.toString())) {
		fs.rmSync(outDir.toString(), { recursive: true })
	}
	performance.stop('jestEnv.setup.clearOutDir')
	performance.stop('jestEnv.setup')
	performance.printReport('jestEnv.setup')
	performance.exportAndSum(outDir.join('performance.json'))
}
