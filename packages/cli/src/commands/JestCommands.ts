import { sync } from 'glob'
import {
	ProfilerConfig,
	GlobalIndex,
	LoggerHelper,
	NodeModule,
	ProjectReport,
	UnifiedPath
} from '@oaklean/profiler-core'
import { program } from 'commander'

export default class JestCommands {
	constructor() {
		const baseCommand = program
			.command('jest')
			.description('Commands to inspect the jest profiler format. This is mostly used for debugging purposes')
		
		baseCommand
			.command('verify')
			.description('Checks wether the accumulate report of the jest-test-environment would be generated the same way with this version')
			.option('-o, --output <output>', 'output file path of the reproduced report (if not set no file will be generated)')
			.action(this.verify.bind(this))
	}

	static init() {
		return new JestCommands()
	}

	async verify(
		options: {
			output?: string
		}
	) {
		const profilerConfig = ProfilerConfig.autoResolve()

		const outDir = profilerConfig.getOutDir().join('jest')
		const globDir = outDir.join('**', '*.oak')

		const accumulatedProjectReportPath = profilerConfig.getOutDir().join(
			'jest',
			'accumulated.oak'
		)

		const filePaths = sync(globDir.toString())
		const reports = filePaths.map((filePath: string) => {
			const unifiedPath = new UnifiedPath(filePath)
			if (unifiedPath.toString() === accumulatedProjectReportPath.toString()) {
				return null
			}
			const report = ProjectReport.loadFromFile(unifiedPath, 'bin')
			if (!report) {
				throw new Error(`ProjectReport could not be found: ${filePath}`)
			}
			return report
		}).filter((report) => report !== null) as ProjectReport[]
		const engineModule = reports.length > 0 ? reports[0].globalIndex.engineModule : NodeModule.currentEngineModule()
		const globalIndex = new GlobalIndex(engineModule)
		const moduleIndex = globalIndex.getModuleIndex('upsert')
		const accumulatedProjectReport = ProjectReport.merge(moduleIndex, ...reports)

		if (options.output) {
			accumulatedProjectReport.storeToFile(
				new UnifiedPath(options.output),
				'bin',
				profilerConfig
			)
			LoggerHelper.log(`The report was stored at ${options.output}`)
		} else {
			LoggerHelper.log('The report was not stored, because no output path was provided')
		}

		const expectedReport = ProjectReport.loadFromFile(accumulatedProjectReportPath, 'bin')
		if (!expectedReport) {
			LoggerHelper.warn(
				`Could not find a profiler report at ${accumulatedProjectReportPath.toPlatformString()}\n` +
				'So no comparison can be made. Please make sure that the report is generated and stored in the original location.'
			)
			return
		}
		accumulatedProjectReport.relativeRootDir = expectedReport.relativeRootDir
		const reportsAreEqual = expectedReport.hash() === accumulatedProjectReport.hash()
		if (reportsAreEqual) {
			LoggerHelper.success('The reports are equal')
		} else {
			LoggerHelper.warn('The reports are not equal')
		}
	}
}