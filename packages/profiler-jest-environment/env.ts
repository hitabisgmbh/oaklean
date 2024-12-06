// my-custom-environment
import type { JestEnvironment } from '@jest/environment'
import {
	JestEnvironmentConfig,
	EnvironmentContext
} from '@jest/environment'
import { Profiler } from '@oaklean/profiler'
import {
	UnifiedPath,
	NanoSeconds_BigInt,
	ProfilerConfig,
	ProjectReportOrigin,
	LoggerHelper,
	ExecutionDetails,
	IProjectReportExecutionDetails,
	PerformanceHelper
} from '@oaklean/profiler-core'
// Jest Environments
import NodeEnvironment from 'jest-environment-node'
import JSDOMEnvironment from 'jest-environment-jsdom'

declare global {
	interface globalThis {
		jestConfig: JestEnvironmentConfig
		jestContext: EnvironmentContext
	}
}

class CustomEnvironment implements JestEnvironment {
	private environment: NodeEnvironment | JSDOMEnvironment

	// private profilers: Profiler
	private testPath: UnifiedPath
	private profiler?: Profiler
	private ranSuccessfully: boolean

	get global() {
		return this.environment.global
	}

	get fakeTimers() {
		return this.environment.fakeTimers
	}

	get fakeTimersModern() {
		return this.environment.fakeTimersModern
	}

	get moduleMocker() {
		return this.environment.moduleMocker
	}

	getVmContext() {
		return this.environment.getVmContext()
	}

	exportConditions() {
		return this.environment.exportConditions()
	}

	constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
		switch (config.projectConfig.testEnvironmentOptions['testEnvironment']) {
			case 'jsdom':
				this.environment = new JSDOMEnvironment(config, context)
				break
			case 'node':
			default:
				this.environment = new NodeEnvironment(config, context)
				break
		}
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
		await this.environment.setup()
		if (process.env.ENABLE_MEASUREMENTS && this.profiler) {
			const performance = new PerformanceHelper()
			try {
				performance.start('jestEnv.env.setup')
				performance.start('jestEnv.env.resolveConfig')
				const config = ProfilerConfig.autoResolve()
				performance.stop('jestEnv.env.resolveConfig')

				performance.start('jestEnv.env.resolveExecutionDetails')
				const executionDetails = await this.getExecutionDetails(config)
				performance.stop('jestEnv.env.resolveExecutionDetails')

				performance.stop('jestEnv.env.setup')
				performance.printReport('jestEnv.env.setup')
				performance.exportAndSum(this.profiler.outputDir().join('performance.json'))

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
			const performance = new PerformanceHelper()
			try {
				performance.start('jestEnv.env.teardown')
				const stopTime = process.hrtime.bigint() as NanoSeconds_BigInt
				performance.stop('jestEnv.env.teardown')
				performance.printReport('jestEnv.env.teardown')
				performance.exportAndSum(this.profiler.outputDir().join('performance.json'))

				await this.profiler.finish(this.testPath.toString(), stopTime)
			} catch (e) {
				LoggerHelper.error('CustomEnvironment.teardown(): ', e)
			}
		}
		await this.environment.teardown()
	}

	// async handleTestEvent(event, state) {
	// 	return
	// }
}

module.exports = CustomEnvironment