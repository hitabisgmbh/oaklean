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
	CPUProfileHelper
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

				const title = ExportAssetHelper.titleFromReportFilePath(reportPath)
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
}
