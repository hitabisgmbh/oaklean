import * as fs from 'fs'

import { createScriptTransformer, shouldInstrument, ScriptTransformer } from '@jest/transform'
import { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'

import { BaseAdapter } from './BaseAdapter'

import { UnifiedPath } from '../../system/UnifiedPath'


export class JestAdapter extends BaseAdapter {
	private _config: JestEnvironmentConfig
	private _context: EnvironmentContext
	private _transformer?: ScriptTransformer

	constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
		super()
		this._config = config
		this._context = context
	}

	async config() {
		return this._config
	}

	async context() {
		return this._context
	}

	async transformer(): Promise<ScriptTransformer> {
		if (!this._transformer) {
			this._transformer = await createScriptTransformer((await this.config()).projectConfig)
		}
		return this._transformer
	}

	async shouldProcess(filePath: UnifiedPath): Promise<boolean> {
		const transformer = await this.transformer()

		return transformer.shouldTransform(filePath.toPlatformString())
	}

	async process(filePath: UnifiedPath): Promise<string> {
		const config = await this.config()
		const transformer = await this.transformer()

		if (await this.shouldProcess(filePath)) {
			const typescriptSourceCode = fs.readFileSync(filePath.toPlatformString()).toString()
			const instrument = shouldInstrument(filePath.toPlatformString(), config.globalConfig, config.projectConfig)

			const { code } = transformer.transformSource(
				filePath.toPlatformString(),
				typescriptSourceCode,
				{
					instrument: instrument,
					supportsDynamicImport: false,
					supportsExportNamespaceFrom: false,
					supportsStaticESM: false,
					supportsTopLevelAwait: false,
				}
			)

			return code
		}
		throw new Error('JestAdapter.process: Jest does not transform the file: ' + filePath.toPlatformString())
	}
}
