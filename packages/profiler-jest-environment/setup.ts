import * as fs from 'fs'

import { Profiler, PerfSensorInterface } from '@oaklean/profiler'
import { ProfilerConfig, APP_NAME, SensorInterfaceType } from '@oaklean/profiler-core'
import { PerfEvent } from '@oaklean/profiler/dist/src/interfaces/perf/PerfSensorInterface'

export default async function () {
	if (!process.env.ENABLE_MEASUREMENTS) {
		return
	}
	console.log('\n(Oaklean Profiler) Clean up Measurements')
	const profilerConfig = ProfilerConfig.autoResolve()
	const outDir = profilerConfig.getOutDir().join('jest')
	
	console.log(`(${APP_NAME} Profiler) V8 sample rate: ${profilerConfig.getV8CPUSamplingInterval()}ms`)
	const sensorInterfaceOptions = profilerConfig.getSensorInterfaceOptions()
	if (sensorInterfaceOptions !== undefined) {
		console.log(`(${APP_NAME} Profiler) Using SensorInterface: `, profilerConfig.getSensorInterfaceType())
		console.log(
			`(${APP_NAME} Profiler) SensorInterface Sample Interval: ${sensorInterfaceOptions.sampleInterval}ms`
		)

		const sensorInterface = Profiler.getSensorInterface(profilerConfig)
		if (sensorInterface !== undefined) {
			if (await sensorInterface.canBeExecuted() === false) {
				console.error(
					`(${APP_NAME} Profiler) Sensor Interface cannot be executed with these permissions`
				)
			} else {
				if (sensorInterface.type() === SensorInterfaceType.perf) {
					const availableMeasurementTypes = await (
						sensorInterface as PerfSensorInterface).availableMeasurementTypes()
					console.log(
						`(${APP_NAME} Profiler) Measure CPU Energy: ` + 
						`${availableMeasurementTypes[PerfEvent.ENERGY_CORES]}`
					)
					console.log(
						`(${APP_NAME} Profiler) Measure RAM Energy: ` +
						`${availableMeasurementTypes[PerfEvent.ENERGY_RAM]}`
					)
				}
			}
		} else {
			console.log(`(${APP_NAME} Profiler) Something went wrong loading the SensorInterface`)
		}

	} else {
		console.log(
			`(${APP_NAME} Profiler) no SensorInterface configured ` + 
			'(no energy measurements will be collected, only cpu time)'
		)
	}

	if (fs.existsSync(outDir.toString())) {
		fs.rmSync(outDir.toString(), { recursive: true })
	}
}
