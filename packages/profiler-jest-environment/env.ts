// my-custom-environment
import { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node'
import { Profiler } from '@oaklean/profiler'
import { UnifiedPath, GitHelper, TimeHelper, SystemInformation, NodeModule, NanoSeconds_BigInt, ProfilerConfig, ProjectReportOrigin } from '@oaklean/profiler-core'

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

	async setup() {
		await super.setup()
		if (process.env.ENABLE_MEASUREMENTS && this.profiler) {
			try {
				const commitHash = GitHelper.currentCommitHash()
				const uncommittedChanges = GitHelper.uncommittedChanges()
				const config = ProfilerConfig.autoResolve()

				const engineModule = NodeModule.currentEngineModule()

				await this.profiler.start(
					this.testPath.toString(),
					{
						origin: ProjectReportOrigin.jestEnv,
						commitHash: commitHash,
						timestamp: TimeHelper.getCurrentTimeStamp(),
						uncommittedChanges: uncommittedChanges,
						systemInformation: await SystemInformation.collect(),
						languageInformation: {
							name: engineModule.name,
							version: engineModule.version
						},
						runTimeOptions: config.getAnonymizedRuntimeOptions()
					}
				)
			} catch (e) {
				console.error('CustomEnvironment.setup():', e)
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
				console.error('CustomEnvironment.teardown(): ', e)
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