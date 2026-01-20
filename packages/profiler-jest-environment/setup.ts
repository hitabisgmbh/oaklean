import * as fs from 'fs'

import { Profiler, PerfSensorInterface } from '@oaklean/profiler'
import {
	ProfilerConfig,
	SensorInterfaceType,
	LoggerHelper,
	PerformanceHelper,
	ExportAssetHelper
} from '@oaklean/profiler-core'
import { PerfEvent } from '@oaklean/profiler/dist/src/interfaces/perf/PerfSensorInterface'

import { ENABLE_MEASUREMENTS } from './constants'

export default async function () {
	if (!ENABLE_MEASUREMENTS) {
		return
	}
	const performance = new PerformanceHelper()
	performance.start('jestEnv.setup')
	LoggerHelper.appPrefix.log('Clean up Measurements')
	performance.start('jestEnv.setup.resolveConfig')
	const profilerConfig = ProfilerConfig.autoResolve()
	performance.stop('jestEnv.setup.resolveConfig')
	const exportAssetHelper = new ExportAssetHelper(profilerConfig.getOutDir().join('jest'))

	LoggerHelper.appPrefix.log(`V8 sample rate: ${profilerConfig.getV8CPUSamplingInterval()}ms`)
	performance.stop('jestEnv.setup.getSensorInterfaceOptions')
	const sensorInterfaceOptions = profilerConfig.getSensorInterfaceOptions()
	performance.stop('jestEnv.setup.getSensorInterfaceOptions')
	if (sensorInterfaceOptions !== undefined) {
		LoggerHelper.appPrefix.log('Using SensorInterface: ', profilerConfig.getSensorInterfaceType())
		LoggerHelper.appPrefix.log(`SensorInterface Sample Interval: ${sensorInterfaceOptions.sampleInterval}ms`)

		performance.start('jestEnv.setup.Profiler.getSensorInterface')
		const sensorInterface = Profiler.getSensorInterface(profilerConfig)
		performance.stop('jestEnv.setup.Profiler.getSensorInterface')
		if (sensorInterface !== undefined) {
			performance.start('jestEnv.setup.sensorInterface.canBeExecuted')
			const canBeExecuted = await sensorInterface.canBeExecuted()
			performance.stop('jestEnv.setup.sensorInterface.canBeExecuted')
			if (canBeExecuted === false) {
				LoggerHelper.appPrefix.error('Sensor Interface cannot be executed with these permissions')
			} else {
				if (sensorInterface.type() === SensorInterfaceType.perf) {
					const availableMeasurementTypes = await (sensorInterface as PerfSensorInterface).availableMeasurementTypes()
					LoggerHelper.appPrefix.log('Measure CPU Energy: ' + `${availableMeasurementTypes[PerfEvent.ENERGY_CORES]}`)
					LoggerHelper.appPrefix.log('Measure RAM Energy: ' + `${availableMeasurementTypes[PerfEvent.ENERGY_RAM]}`)
				}
			}
		} else {
			LoggerHelper.appPrefix.log('Something went wrong loading the SensorInterface')
		}
	} else {
		LoggerHelper.appPrefix.log(
			'no SensorInterface configured ' + '(no energy measurements will be collected, only cpu time)'
		)
	}

	performance.start('jestEnv.setup.clearOutDir')
	if (fs.existsSync(exportAssetHelper.outputDir().toString())) {
		fs.rmSync(exportAssetHelper.outputDir().toString(), { recursive: true })
	}
	performance.stop('jestEnv.setup.clearOutDir')
	performance.stop('jestEnv.setup')
	performance.printReport('jestEnv.setup')
	performance.exportAndSum(exportAssetHelper.outputPerformancePath())
}
