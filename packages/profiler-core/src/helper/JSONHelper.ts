import * as fs from 'fs'

import { JsonStreamStringify } from 'json-stream-stringify'

import { PermissionHelper } from './PermissionHelper'

import { UnifiedPath } from '../system/UnifiedPath'

export class JSONHelper {
	static async storeBigJSON(
		json: any,
		outputPath: UnifiedPath
	): Promise<void> {
		const outputStream = fs.createWriteStream(outputPath.toPlatformString())
		const jsonStream = new JsonStreamStringify(json, undefined, 2)

		await PermissionHelper.writeFileWithStorageFunctionWithUserPermissionAsync(
			outputPath,
			() => new Promise((resolve) => {
				jsonStream.pipe(outputStream)
				outputStream.on('finish', () => {
					resolve(undefined)
				})
			})
		)
	}
}