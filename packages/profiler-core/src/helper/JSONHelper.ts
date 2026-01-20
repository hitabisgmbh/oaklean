import * as fs from 'fs'

import oboe from 'oboe'
import { JsonStreamStringify } from 'json-stream-stringify'

import { PermissionHelper } from './PermissionHelper'

import { UnifiedPath } from '../system/UnifiedPath'

export class JSONHelper {
	static async storeBigJSON(
		outputPath: UnifiedPath,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		json: any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
		replacer?: any,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		spaces?: string | number | undefined
	): Promise<void> {
		const outputStream = fs.createWriteStream(outputPath.toPlatformString())
		const jsonStream = new JsonStreamStringify(json, undefined, 2)

		await PermissionHelper.writeFileWithStorageFunctionWithUserPermissionAsync(
			outputPath,
			() =>
				new Promise((resolve) => {
					jsonStream.pipe(outputStream)
					outputStream.on('finish', () => {
						resolve(undefined)
					})
				})
		)
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static async loadBigJSON(inputPath: UnifiedPath): Promise<any> {
		return new Promise((resolve, reject) => {
			const fileStream = fs.createReadStream(inputPath.toPlatformString())

			const jsonStream = oboe(fileStream)

			jsonStream.done((data) => {
				resolve(data)
			})

			jsonStream.fail((error) => {
				reject(error)
			})
		})
	}
}
