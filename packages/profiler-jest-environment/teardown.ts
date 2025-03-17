import * as fs from 'fs'

import { sync } from 'glob'
import {
	ProfilerConfig,
	ProjectReport,
	UnifiedPath,
	GlobalIndex,
	NodeModule,
	LoggerHelper,
	PerformanceHelper
} from '@oaklean/profiler-core'

export default async function () {
	if (!process.env.ENABLE_MEASUREMENTS) {
		return
	}
	const performance = new PerformanceHelper()
	performance.start('jestEnv.teardown')
	LoggerHelper.log('Profiler: Combine Measurements and generate an aggregated report')

	performance.start('jestEnv.teardown.resolveConfig')
	const profilerConfig = ProfilerConfig.autoResolve()
	performance.stop('jestEnv.teardown.resolveConfig')
	const outDir = profilerConfig.getOutDir().join('jest')
	const globDir = outDir.join('**', '*.oak')

	if (fs.existsSync(outDir.toString())) {
		const filePaths = sync(globDir.toString())
		performance.start('jestEnv.teardown.loadReports')
		const reports = filePaths.map((filePath: string) => {
			const report = ProjectReport.loadFromFile(new UnifiedPath(filePath), 'bin')
			if (!report) {
				throw new Error(`ProjectReport could not be found: ${filePath}`)
			}
			return report
		})
		performance.stop('jestEnv.teardown.loadReports')

		performance.start('jestEnv.teardown.resolveEngineModule')
		const engineModule = reports.length > 0 ? reports[0].globalIndex.engineModule : NodeModule.currentEngineModule()
		performance.stop('jestEnv.teardown.resolveEngineModule')

		const globalIndex = new GlobalIndex(engineModule)
		const moduleIndex = globalIndex.getModuleIndex('upsert')

		performance.start('jestEnv.teardown.mergeReports')
		const accumulatedProjectReport = ProjectReport.merge(moduleIndex, ...reports)
		performance.stop('jestEnv.teardown.mergeReports')

		const accumulatedProjectReportPath = profilerConfig.getOutDir().join(
			'jest',
			'accumulated.oak'
		)

		performance.start('jestEnv.teardown.exportReport')
		accumulatedProjectReport.storeToFile(accumulatedProjectReportPath, 'bin', profilerConfig)
		performance.stop('jestEnv.teardown.exportReport')

		const commitHash = accumulatedProjectReport.executionDetails.commitHash
		const accumulatedProjectReportHistoryPath = profilerConfig.getOutHistoryDir().join(
			`${accumulatedProjectReport.projectMetaData.projectID}`,
			accumulatedProjectReport.executionDetails.timestamp + (commitHash ? '-' + commitHash : '') + '.oak'
		)

		performance.start('jestEnv.teardown.exportHistoryReport')
		accumulatedProjectReport.storeToFile(accumulatedProjectReportHistoryPath, 'bin', profilerConfig)
		performance.stop('jestEnv.teardown.exportHistoryReport')

		if (await accumulatedProjectReport.shouldBeStoredInRegistry()) {
			performance.start('jestEnv.teardown.uploadToRegistry')
			await accumulatedProjectReport.uploadToRegistry()
			performance.stop('jestEnv.teardown.uploadToRegistry')
		}
		performance.stop('jestEnv.teardown')
		performance.printReport('jestEnv.teardown')
		performance.exportAndSum(outDir.join('performance.json'))
	}
}
