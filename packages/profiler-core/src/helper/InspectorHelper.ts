import * as fs from 'fs'
import inspector from 'inspector'

import { LoggerHelper } from './LoggerHelper'
import { CPUModel } from './CPUModel'

import { SourceMap } from '../model/SourceMap'
import { UnifiedPath } from '../system/UnifiedPath'
// Types
import { IInspectorHelper } from '../types/helper/InspectorHelper'
import { PermissionHelper } from './PermissionHelper'

export class InspectorHelper {
	private _session: inspector.Session
	// maps scriptId to source code
	private sourceCodeMap: Map<string, string>
	// maps scriptId to a source map
	private sourceMapMap: Map<string, SourceMap | null>

	constructor() {
		this._session = new inspector.Session()
		this.sourceCodeMap = new Map()
		this.sourceMapMap = new Map()
	}

	async connect() {
		this._session.connect()
		// wait for debugger to be enabled
		await new Promise((resolve) => {
			this._session.post('Debugger.enable', resolve)
		})
	}

	storeToFile(
		filePath: UnifiedPath,
		kind: 'pretty-json' | 'json'
	) {
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(filePath.dirName().toPlatformString())
		}

		switch (kind) {
			case 'pretty-json':
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					JSON.stringify(this, null, 2)
				)
				break
			case 'json':
				PermissionHelper.writeFileWithUserPermission(
					filePath.toPlatformString(),
					JSON.stringify(this)
				)
				break
			default:
				break
		}
	}

	static loadFromFile(
		filePath: UnifiedPath
	): InspectorHelper | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return InspectorHelper.fromJSON(
			fs.readFileSync(filePath.toPlatformString()).toString()
		)
	}

	toJSON(): IInspectorHelper {
		return {
			sourceCodeMap: Object.fromEntries(this.sourceCodeMap),
			sourceMapMap: Object.fromEntries(this.sourceMapMap)
		}
	}

	static fromJSON(
		json: string | IInspectorHelper
	) {
		let data: IInspectorHelper
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new InspectorHelper()
		for (const [key, value] of Object.entries(data.sourceCodeMap)) {
			result.sourceCodeMap.set(key, value)
		}
		for (const [key, value] of Object.entries(data.sourceMapMap)) {
			if (value === null) {
				result.sourceMapMap.set(key, null)
				continue
			}
			result.sourceMapMap.set(key, SourceMap.fromJSON(value))
		}

		return result
	}

	listen() {
		this._session.on('inspectorNotification', async (message) => {
			if (message.method === 'Debugger.scriptParsed') {
				const params = message.params as {
					url: string,
					scriptId: string
				}
				await this.sourceCodeFromId(params.scriptId)
			}
		})
	}

	async disconnect() {
		await new Promise((resolve) => {
			this._session.post('Debugger.disable', resolve)
		})
		this._session.disconnect()
	}

	async fillSourceMapsFromCPUModel(cpuModel: CPUModel) {
		const scriptMap = new Map<string, string>()

		for (const location of cpuModel.ILocations) {
			const scriptId = location.callFrame.scriptId.toString()
			if (scriptMap.has(scriptId)) {
				continue
			}
			scriptMap.set(scriptId, location.callFrame.url)
		}
		
		const promises = []
		for (const [scriptId, filePath] of scriptMap) {
			promises.push(this.sourceMapFromId(new UnifiedPath(filePath), scriptId))
		}

		await Promise.all(promises)
	}

	async sourceCodeFromId(
		scriptId: string,
		filePath?: UnifiedPath
	): Promise<string | null> {
		if (scriptId === '0') {
			return null
		}
		let source = this.sourceCodeMap.get(scriptId)
		if (source) {
			return source
		}

		const result = await (new Promise<
		{
			source: string,
			err?: Error
		}
		>((resolve) => {
			this._session.post('Debugger.getScriptSource', { scriptId }, (err, args) => {
				if (err) {
					resolve({ source: '', err })
				} else {
					resolve({ source: args.scriptSource })
				}
			})
		}))
		if (result.err) {
			LoggerHelper.error('Error getting script source', result.err, { scriptId, filePath })
			throw result.err
		}
		source = result.source
		this.sourceCodeMap.set(scriptId, source)
		return source
	}

	async sourceMapFromId(
		filePath: UnifiedPath,
		scriptId: string
	): Promise<SourceMap | null> {
		if (scriptId === '0') {
			return null
		}
		let sourceMap = this.sourceMapMap.get(scriptId)
		if (sourceMap !== undefined) {
			return sourceMap
		}
		const sourceCode = await this.sourceCodeFromId(scriptId, filePath)
		if (sourceCode === null) {
			throw new Error(`No source map found for scriptId ${filePath.toPlatformString()} ${scriptId}`)
		}
		sourceMap = SourceMap.fromCompiledJSString(filePath, sourceCode)
		this.sourceMapMap.set(scriptId, sourceMap)
		return sourceMap
		
	}
}