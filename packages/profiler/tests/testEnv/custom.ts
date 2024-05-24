// my-custom-environment
import { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node'

declare global {
	interface globalThis {
		jestConfig: JestEnvironmentConfig
		jestContext: EnvironmentContext
	}
}

class CustomEnvironment extends NodeEnvironment {
	constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
		super(config, context)
		this.global.jestConfig = config
		this.global.jestContext = context
	}

	async setup() {
		await super.setup()
	}

	async teardown() {
		await super.teardown()
	}

	getVmContext() {
		return super.getVmContext()
	}
}

module.exports = CustomEnvironment