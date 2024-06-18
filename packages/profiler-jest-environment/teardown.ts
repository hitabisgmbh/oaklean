import * as fs from 'fs'

import { sync } from 'glob'
import { ProfilerConfig, ProjectReport, UnifiedPath, GlobalIndex, NodeModule } from '@oaklean/profiler-core'

export default async function () {
	if (!process.env.ENABLE_MEASUREMENTS) {
		return
	}
	console.log('Profiler: Combine Measurements and generate an aggregated report')

	const profilerConfig = ProfilerConfig.autoResolve()
	const outDir = profilerConfig.getOutDir().join('jest')
	const globDir = outDir.join('**', '*.oak')

	if (fs.existsSync(outDir.toString())) {
		const filePaths = sync(globDir.toString())
		const reports = filePaths.map((filePath: string) => {
			const report = ProjectReport.loadFromFile(new UnifiedPath(filePath), 'bin')
			if (!report) {
				throw new Error(`ProjectReport could not be found: ${filePath}`)
			}
			return report
		})
		const engineModule = reports.length > 0 ? reports[0].globalIndex.engineModule : NodeModule.currentEngineModule()
		const globalIndex = new GlobalIndex(engineModule)
		const moduleIndex = globalIndex.getModuleIndex('upsert')
		const accumulatedProjectReport = ProjectReport.merge(moduleIndex, ...reports)
		const accumulatedProjectReportPath = profilerConfig.getOutDir().join(
			'jest',
			`accumulated-${accumulatedProjectReport.executionDetails.timestamp}.oak`
		)
		accumulatedProjectReport.storeToFile(accumulatedProjectReportPath, 'bin', profilerConfig)
		const commitHash = accumulatedProjectReport.executionDetails.commitHash
		const accumulatedProjectReportHistoryPath = profilerConfig.getOutHistoryDir().join(
			`${accumulatedProjectReport.projectMetaData.projectID}`,
			accumulatedProjectReport.executionDetails.timestamp + (commitHash ? '-' + commitHash : '') + '.oak'
		)
		accumulatedProjectReport.storeToFile(accumulatedProjectReportHistoryPath, 'bin', profilerConfig)
		if (await accumulatedProjectReport.shouldBeStoredInRegistry()) {
			await accumulatedProjectReport.uploadToRegistry()
		}
	}
}
