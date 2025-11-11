import * as fs from 'fs'

import { Profiler } from '@oaklean/profiler'
import {
	ProfilerConfig,
	GlobalIndex,
	LoggerHelper,
	NodeModule,
	ProjectReport,
	UnifiedPath,
	ExportAssetHelper,
	ExternalResourceHelper,
	MetricsDataCollection,
	ReportKind,
	CPUProfileHelper,
	SourceFileMetaDataTree
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class JestCommands {
	constructor() {
		const baseCommand = program
			.command('jest')
			.description(
				'Commands to inspect the jest profiler format. This is mostly used for debugging purposes'
			)

		baseCommand
			.command('verify')
			.description(
				'Checks wether the accumulate report of the jest-test-environment would be generated the same way with this version'
			)
			.option(
				'-o, --output <output>',
				'output file path of the reproduced report (if not set no file will be generated)'
			)
			.option(
				'-d, --deep',
				'also check wether each report would be generated the same way'
			)
			.option(
				'-m, --measure',
				'also measure the reproduction of the reports and outputs a report (this will take longer, but is useful for performance comparisons)'
			)
			.action(this.verify.bind(this))

		baseCommand
			.command('inspect-profiles')
			.description(
				'Inspects all reports and cpu profiles in the jests output directory and verifies their consistency'
			)
			.action(this.inspectCPUProfiles.bind(this))
		
		baseCommand
			.command('verify-trees')
			.description(
				'Checks all sub reports in the output directory for SourceFileMetaDataTree consistency'
			)
			.action(this.verifyTrees.bind(this))
	}

	static init() {
		return new JestCommands()
	}

	async verify(options: { output?: string; deep?: string; measure?: boolean }) {
		const profilerConfig = ProfilerConfig.autoResolve()
		const rootDir = profilerConfig.getRootDir()

		const exportAssetHelper = new ExportAssetHelper(
			profilerConfig.getOutDir().join('jest')
		)

		const verifyExportAssetHelper = new ExportAssetHelper(
			profilerConfig.getOutDir().join('jest-verify')
		)

		const reportPaths = exportAssetHelper.allReportPathsInOutputDir()
		const accumulatedProjectReportPath =
			exportAssetHelper.outputAccumulatedReportPath()

		const expectedAccumulatedReport = ProjectReport.loadFromFile(
			accumulatedProjectReportPath,
			'bin'
		)
		if (!expectedAccumulatedReport) {
			LoggerHelper.warn(
				`Could not find a profiler report at ${accumulatedProjectReportPath.toPlatformString()}\n` +
					'So no comparison can be made. Please make sure that the report is generated and stored in the original location.'
			)
			return
		}

		let profiler: Profiler | undefined
		if (options.measure !== undefined) {
			LoggerHelper.success('Measuring the reproduction of the reports.')
			profiler = new Profiler('verify')
			await profiler.start('latest')
		}

		const reports: ProjectReport[] = []
		if (options.deep !== undefined) {
			if (fs.existsSync(verifyExportAssetHelper.outputDir().toString())) {
				fs.rmSync(verifyExportAssetHelper.outputDir().toString(), {
					recursive: true
				})
			}
			for (const reportPath of reportPaths) {
				const expectedReport = ProjectReport.loadFromFile(reportPath, 'bin')
				if (!expectedReport) {
					LoggerHelper.error(`ProjectReport could not be found: ${reportPath}`)
					continue
				}

				if (reportPath.toString() === accumulatedProjectReportPath.toString()) {
					continue // Skip the accumulated report itself
				}

				const title = exportAssetHelper.titleFromReportFilePath(reportPath)
				const assetPath = exportAssetHelper
					.outputDir()
					.pathTo(reportPath.dirName())
					.join(title)
					.toString()

				const report = new ProjectReport(
					expectedReport.executionDetails,
					ReportKind.measurement
				)

				const metricsDataCollectionPath =
					exportAssetHelper.outputMetricsDataCollectionPath(assetPath)
				const externalResourceHelperPath =
					exportAssetHelper.outputExternalResourceHelperPath(assetPath)
				const v8CPUProfilePath =
					exportAssetHelper.outputCPUProfilePath(assetPath)

				const cpuProfile = await CPUProfileHelper.loadFromFile(v8CPUProfilePath)

				if (cpuProfile === undefined) {
					LoggerHelper.error(
						`CPU profile could not be loaded from ${v8CPUProfilePath.toPlatformString()}. ` +
							'Please make sure the file exists and is a valid CPU profile.'
					)
					continue
				}

				const metricsDataCollection = MetricsDataCollection.loadFromFile(
					metricsDataCollectionPath
				)

				const externalResourceHelper = ExternalResourceHelper.loadFromFile(
					rootDir,
					externalResourceHelperPath
				)

				if (externalResourceHelper === undefined) {
					LoggerHelper.error(
						'External Resource Helper could not be loaded from' +
							externalResourceHelperPath.toPlatformString() +
							' Please make sure the file exists and is a valid external resource helper.'
					)
					continue
				}
				LoggerHelper.log(`[REPRODUCE] ${reportPath.toPlatformString()}`)
				await report.insertCPUProfile(
					rootDir,
					cpuProfile,
					externalResourceHelper,
					metricsDataCollection
				)

				report.trackUncommittedFiles(rootDir, externalResourceHelper)
				report.relativeRootDir = expectedReport.relativeRootDir

				if (report.hash() !== expectedReport.hash()) {
					LoggerHelper.warn(
						`[NOT_REPRODUCIBLE] ${reportPath.toPlatformString()}`,
						report.hash(),
						expectedReport.hash()
					)
					report.storeToFile(
						verifyExportAssetHelper.outputReportPath(assetPath),
						'pretty-json',
						profilerConfig
					)
					expectedReport.storeToFile(
						verifyExportAssetHelper.outputReportPath(assetPath + '-expected'),
						'pretty-json',
						profilerConfig
					)
				} else {
					LoggerHelper.success(
						`[REPRODUCIBLE] ${reportPath.toPlatformString()}`
					)
				}
				reports.push(report)
			}
		} else {
			for (const reportPath of reportPaths) {
				if (reportPath.toString() === accumulatedProjectReportPath.toString()) {
					continue // Skip the accumulated report itself
				}
				const report = ProjectReport.loadFromFile(reportPath, 'bin')
				if (!report) {
					throw new Error(`ProjectReport could not be found: ${reportPath}`)
				}
				reports.push(report)
			}
		}

		const engineModule =
			reports.length > 0
				? reports[0].globalIndex.engineModule
				: NodeModule.currentEngineModule()
		const globalIndex = new GlobalIndex(engineModule)
		const moduleIndex = globalIndex.getModuleIndex('upsert')
		const accumulatedProjectReport = ProjectReport.merge(
			moduleIndex,
			...reports
		)
		if (profiler !== undefined) {
			await profiler.finish('latest')
			LoggerHelper.success(
				'Stored performance report at',
				profiler.exportAssetHelper.outputReportPath('latest').toPlatformString()
			)
		}

		if (options.output) {
			accumulatedProjectReport.storeToFile(
				new UnifiedPath(options.output),
				'bin',
				profilerConfig
			)
			LoggerHelper.log(`The report was stored at ${options.output}`)
		} else {
			LoggerHelper.log(
				'The report was not stored, because no output path was provided'
			)
		}

		accumulatedProjectReport.relativeRootDir =
			expectedAccumulatedReport.relativeRootDir
		const reportsAreEqual =
			expectedAccumulatedReport.hash() === accumulatedProjectReport.hash()
		if (reportsAreEqual) {
			LoggerHelper.success('The reports are equal')
		} else {
			LoggerHelper.warn('The reports are not equal')
		}
	}

	async inspectCPUProfiles() {
		const profilerConfig = ProfilerConfig.autoResolve()

		const exportAssetHelper = new ExportAssetHelper(
			profilerConfig.getOutDir().join('jest')
		)

		const accumulatedProjectReportPath =
			exportAssetHelper.outputAccumulatedReportPath()

		const reportPaths = exportAssetHelper.allReportPathsInOutputDir()

		let totalNodeCount = 0,
			totalSourceNodeLocationCount = 0,
			totalSampleCount = 0,
			totalHits = 0,
			totalCPUTime = 0

		for (const reportPath of reportPaths) {
			if (reportPath.toString() === accumulatedProjectReportPath.toString()) {
					continue // Skip the accumulated report itself
				}

			const title = exportAssetHelper.titleFromReportFilePath(reportPath)
			const cpuProfilePath = exportAssetHelper.outputCPUProfilePath(title)

			const report = ProjectReport.loadFromFile(reportPath, 'bin')
			if (!report) {
				LoggerHelper.error(`ProjectReport could not be found: ${reportPath}`)
				continue
			}

			const cpuProfile = await CPUProfileHelper.loadFromFile(cpuProfilePath)
			if (cpuProfile === undefined) {
				LoggerHelper.error(
					`CPU profile could not be loaded from ${cpuProfilePath.toPlatformString()}. ` +
					'Please make sure the file exists and is a valid CPU profile.'
				)
				return
			}

			const inspectResult = await CPUProfileHelper.inspect(cpuProfile)
			totalNodeCount += inspectResult.nodeCount
			totalSourceNodeLocationCount += inspectResult.sourceNodeLocationCount
			totalSampleCount += inspectResult.sampleCount
			totalHits += inspectResult.totalHits
			totalCPUTime += inspectResult.totalCPUTime

			const reportsTotal = report.totalAndMaxMetaData().total.sensorValues.aggregatedCPUTime

			if (reportsTotal !== inspectResult.totalCPUTime) {
				LoggerHelper.warn(
					`Inconsistent CPU time in report: ${title}.\n` +
					`Profile CPU Time: ${inspectResult.totalCPUTime}\n` +
					`Report CPU Time: ${reportsTotal}`
				)
			} else {
				LoggerHelper.success(
					`Consistent CPU time in report: ${title}. CPU Time: ${reportsTotal}`
				)
			}
		}
		LoggerHelper.table([
			{
				type: 'Files Inspected',
				value: reportPaths.length
			},
			{
				type: 'Total Node Count',
				value: totalNodeCount
			},
			{
				type: 'Source Node Location Count',
				value: totalSourceNodeLocationCount
			},
			{
				type: 'Sample Count',
				value: totalSampleCount
			},
			{
				type: 'Total Hits',
				value: totalHits
			},
			{
				type: 'Total CPU Time',
				value: totalCPUTime,
				unit: 'µs'
			}
		], ['type', 'value', 'unit'])
	}

	async verifyTrees() {
		const profilerConfig = ProfilerConfig.autoResolve()

		const exportAssetHelper = new ExportAssetHelper(
			profilerConfig.getOutDir().join('jest')
		)

		const reportPaths = exportAssetHelper.allReportPathsInOutputDir()

		let totalDiff = 0

		for (const reportPath of reportPaths) {
			const projectReport = ProjectReport.loadFromFile(reportPath, 'bin')

			if (!projectReport) {
				LoggerHelper.error(`ProjectReport could not be found: ${reportPath}`)
				continue
			}

			const sourceFileMetaDataTree = SourceFileMetaDataTree.fromProjectReport(
        projectReport
      ).filter(projectReport.asSourceNodeGraph(), undefined, undefined).node

			if (!sourceFileMetaDataTree) {
				LoggerHelper.error(`SourceFileMetaDataTree could not be constructed from ProjectReport: ${reportPath}`)
				continue
			}

			const total = projectReport.totalAndMaxMetaData().total

			const treeSum = sourceFileMetaDataTree.aggregatedInternSourceMetaData.total.sensorValues.aggregatedCPUTime +
				sourceFileMetaDataTree.headlessSensorValues.langInternalCPUTime +
				sourceFileMetaDataTree.headlessSensorValues.externCPUTime
			
			// const treeSum = sourceFileMetaDataTree.aggregatedInternSourceMetaData.total.sensorValues.selfCPUTime +
			// 	sourceFileMetaDataTree.aggregatedLangInternalSourceNodeMetaData.total.sensorValues.selfCPUTime +
			// 	sourceFileMetaDataTree.aggregatedExternSourceMetaData.total.sensorValues.selfCPUTime

			const diff = total.sensorValues.aggregatedCPUTime - treeSum
			totalDiff += diff

			if (diff !== 0) {
				LoggerHelper.error(
					`Inconsistent SourceFileMetaDataTree in report: ${reportPath.toPlatformString()}.\n` +
					'Tree sum does not match total CPU time.\n',
					`Tree Sum: ${treeSum}`,
					`Total CPU Time: ${total.sensorValues.aggregatedCPUTime}`,
					`Difference: ${diff}`
				)
				continue
			}
		}
		if (totalDiff === 0) {
			LoggerHelper.success('All SourceFileMetaDataTrees are consistent.')
		} else {
			LoggerHelper.error(
				`Total CPU time difference across all reports: ${totalDiff}`
			)
		}
	}
}
