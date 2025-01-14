import { LoggerHelper } from './LoggerHelper'

import { UnifiedPath } from '../system/UnifiedPath'
import { UnifiedPathPart_string } from '../types'

export class WebpackHelper {
	static transformSourceMapSourcePath(
		rootDir: UnifiedPath,
		originalSource: string
	) {
		const filePath = new UnifiedPath(originalSource)
		if (!filePath.toString().startsWith('./webpack://')) {
			return filePath
		}
		const filePathParts = filePath.split().slice(3)
		if (filePathParts.length > 0) {
			filePathParts[filePathParts.length - 1] = filePathParts[filePathParts.length - 1].split('?')[0] as UnifiedPathPart_string
		}
		const result = rootDir.join(...filePathParts)
		// LoggerHelper.error('Transformed webpack source path', { filePath, result, cwd: rootDir })
		return result
	}
}