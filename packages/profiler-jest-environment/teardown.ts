import {
	ProfilerConfig,
	ProjectReport,
	UnifiedPath,
	GlobalIndex,
	NodeModule,
	LoggerHelper,
	PerformanceHelper,
	RegistryHelper,
	ExportAssetHelper
} from '@oaklean/profiler-core'

import {
	ENABLE_MEASUREMENTS
} from './constants'

export default async function () {
	if (!ENABLE_MEASUREMENTS) {
		return
	}
	const performance = new PerformanceHelper()
	performance.start('jestEnv.teardown')
	LoggerHelper.log('Profiler: Combine Measurements and generate an aggregated report')

	performance.start('jestEnv.teardown.resolveConfig')
	const profilerConfig = ProfilerConfig.autoResolve()
	performance.stop('jestEnv.teardown.resolveConfig')
	const exportAssetHelper = new ExportAssetHelper(
		profilerConfig.getOutDir().join('jest')
	)

	const reportPaths = exportAssetHelper.allReportPathsInOutputDir()
	performance.start('jestEnv.teardown.loadReports')
	const reports = reportPaths.map((filePath: UnifiedPath) => {
		const report = ProjectReport.loadFromFile(filePath, 'bin')
		if (!report) {
			throw new Error(`ProjectReport could not be found: ${filePath.toPlatformString()}`)
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

	const accumulatedProjectReportPath = exportAssetHelper.outputAccumulatedReportPath()

	performance.start('jestEnv.teardown.exportReport')
	accumulatedProjectReport.storeToFile(accumulatedProjectReportPath, 'bin', profilerConfig)
	performance.stop('jestEnv.teardown.exportReport')

	const commitHash = accumulatedProjectReport.executionDetails.commitHash
	const accumulatedProjectReportHistoryPath = profilerConfig.getOutHistoryDir().join(
		`${accumulatedProjectReport.projectMetaData.projectID}`,
		ExportAssetHelper.historyReportFileName(
			accumulatedProjectReport.executionDetails.timestamp,
			commitHash
		)
	)

	performance.start('jestEnv.teardown.exportHistoryReport')
	accumulatedProjectReport.storeToFile(accumulatedProjectReportHistoryPath, 'bin', profilerConfig)
	performance.stop('jestEnv.teardown.exportHistoryReport')

	if (await accumulatedProjectReport.shouldBeStoredInRegistry()) {
		performance.start('jestEnv.teardown.uploadToRegistry')
		await RegistryHelper.uploadToRegistry(accumulatedProjectReport)
		performance.stop('jestEnv.teardown.uploadToRegistry')
	}
	performance.stop('jestEnv.teardown')
	performance.printReport('jestEnv.teardown')
	performance.exportAndSum(exportAssetHelper.outputPerformancePath())
}
