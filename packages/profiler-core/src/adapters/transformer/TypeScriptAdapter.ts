import * as fs from 'fs'

import { BaseAdapter } from './BaseAdapter'

import { UnifiedPath } from '../../system/UnifiedPath'
import { TypescriptParser } from '../../helper/TypescriptParser'

export class TypeScriptAdapter extends BaseAdapter {
	async process(filePath: UnifiedPath): Promise<string> {
		const typescriptSourceCode = fs.readFileSync(filePath.toPlatformString()).toString()
		return TypescriptParser.transpileCode(filePath, typescriptSourceCode)
	}

	async shouldProcess(filePath: UnifiedPath): Promise<boolean> {
		return filePath.toPlatformString().slice(-3) === '.ts'
	}
}