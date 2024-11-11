// my-custom-environment
import { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node'
import { Profiler } from '@oaklean/profiler'
import {
	UnifiedPath,
	NanoSeconds_BigInt,
	ProfilerConfig,
	ProjectReportOrigin,
	LoggerHelper,
	ExecutionDetails,
	IProjectReportExecutionDetails
} from '@oaklean/profiler-core'

declare global {
	interface globalThis {
		jestConfig: JestEnvironmentConfig
		jestContext: EnvironmentContext
	}
}

class CustomEnvironment extends NodeEnvironment {
	// private profilers: Profiler
	private testPath: UnifiedPath
	private profiler?: Profiler
	private ranSuccessfully: boolean

	constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
		super(config, context)
		const rootDir = new UnifiedPath(config.projectConfig.rootDir)
		this.testPath = rootDir.pathTo(new UnifiedPath(context.testPath))
		this.global.jestConfig = config
		this.global.jestContext = context
		if (process.env.ENABLE_MEASUREMENTS) {
			this.profiler = new Profiler('jest', {
				transformerAdapter: 'ts-jest',
				jestAdapter: {
					config,
					context
				}
			})
		}
		this.ranSuccessfully = true
	}

	private async getExecutionDetails(config: ProfilerConfig): Promise<IProjectReportExecutionDetails> {
		const executionDetailsPath = config.getOutDir().join('jest', 'execution-details.json')
		let executionDetails = ExecutionDetails.loadFromFile(executionDetailsPath)

		if (executionDetails === undefined) {
			executionDetails = await ExecutionDetails.resolveExecutionDetails(config)
			executionDetails.origin = ProjectReportOrigin.jestEnv
			ExecutionDetails.storeToFile(executionDetails, executionDetailsPath)
		}
		return executionDetails
	}

	async setup() {
		await super.setup()
		if (process.env.ENABLE_MEASUREMENTS && this.profiler) {
			try {
				const config = ProfilerConfig.autoResolve()
				const executionDetails = await this.getExecutionDetails(config)

				await this.profiler.start(
					this.testPath.toString(),
					executionDetails
				)
			} catch (e) {
				LoggerHelper.error('CustomEnvironment.setup():', e)
				this.ranSuccessfully = false
			}
		}
	}

	async teardown() {
		if (process.env.ENABLE_MEASUREMENTS && this.profiler) {
			try {
				const stopTime = process.hrtime.bigint() as NanoSeconds_BigInt
				await this.profiler.finish(this.testPath.toString(), stopTime)
			} catch (e) {
				LoggerHelper.error('CustomEnvironment.teardown(): ', e)
			}
		}
		await super.teardown()
	}

	getVmContext() {
		return super.getVmContext()
	}

	// async handleTestEvent(event, state) {
	// 	return
	// }
}

module.exports = CustomEnvironment