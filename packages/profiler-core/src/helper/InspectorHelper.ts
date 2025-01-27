import * as fs from 'fs'
import inspector from 'inspector'

import { LoggerHelper } from './LoggerHelper'
import { PermissionHelper } from './PermissionHelper'
import { TypescriptParser } from './TypescriptParser'

import { ISourceMap, SourceMap } from '../model/SourceMap'
import { UnifiedPath } from '../system/UnifiedPath'
import { NodeModule } from '../model/NodeModule'
import { ProgramStructureTree } from '../model/ProgramStructureTree'
// Types
import {
	IInspectorHelper,
	INodeModule,
	UnifiedPath_string,
	ScriptID_string
} from '../types'
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'

export class InspectorHelper {
	private _session: inspector.Session
	// maps scriptId to source code
	private sourceCodeMap: Map<ScriptID_string, string>
	// maps scriptId to a source map
	private sourceMapMap: Map<ScriptID_string, SourceMap | null>

	// loaded files from the file system
	private loadedFiles: Map<UnifiedPath_string, string | null> // null represents that the file was not found
	private loadedFilesSourceMapMap: Map<UnifiedPath_string, SourceMap | null> // null represents that the file was not found or the file contains no sourcemap

	// loaded node modules
	private nodeModules: Map<UnifiedPath_string, NodeModule | null> // null represents that the node module was not found

	constructor() {
		this._session = new inspector.Session()
		this.sourceCodeMap = new Map()
		this.sourceMapMap = new Map()
		this.loadedFiles = new Map()
		this.loadedFilesSourceMapMap = new Map()
		this.nodeModules = new Map()
	}

	get scriptIds() {
		return Array.from(this.sourceCodeMap.keys())
	}

	get loadedFilePaths() {
		return Array.from(this.loadedFiles.keys())
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
		const nodeModuleJSON: Record<UnifiedPath_string, INodeModule | null> = {}
		for (const [key, value] of this.nodeModules.entries()) {
			if (value === null) {
				nodeModuleJSON[key] = null
				continue
			}
			nodeModuleJSON[key] = value.toJSON()
		}

		const sourceMapMapJson: Record<string, ISourceMap | null> = {}
		for (const [key, value] of this.sourceMapMap.entries()) {
			if (value === null) {
				sourceMapMapJson[key] = null
				continue
			}
			sourceMapMapJson[key] = value.toJSON()
		}

		return {
			sourceCodeMap: Object.fromEntries(this.sourceCodeMap),
			sourceMapMap: sourceMapMapJson,
			loadedFiles: Object.fromEntries(this.loadedFiles),
			nodeModules: nodeModuleJSON
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
			result.sourceCodeMap.set(key as ScriptID_string, value)
		}

		for (const [key, value] of Object.entries(data.loadedFiles)) {
			result.loadedFiles.set(key as UnifiedPath_string, value)
		}

		for (const [key, value] of Object.entries(data.nodeModules)) {
			result.nodeModules.set(key as UnifiedPath_string, value !== null ? NodeModule.fromJSON(value) : null)
		}

		for (const [key, value] of Object.entries(data.sourceMapMap)) {
			result.sourceMapMap.set(key as ScriptID_string, value !== null ? SourceMap.fromJSON(value) : null)
		}

		return result
	}

	async listen() {
		await this._session.on('inspectorNotification', async (message) => {
			if (message.method === 'Debugger.scriptParsed') {
				const params = message.params as {
					url: string,
					scriptId: ScriptID_string
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

	async fillSourceMapsFromCPUProfile(profile: ICpuProfileRaw) {
		const scriptMap = new Map<ScriptID_string, string>()

		for (const location of profile.nodes) {
			const scriptId = location.callFrame.scriptId.toString() as ScriptID_string
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

	loadFile(relativePath: UnifiedPath, filePath: UnifiedPath) {
		let source = this.loadedFiles.get(relativePath.toString())
		if (source !== undefined) {
			return source
		}
		if (fs.existsSync(filePath.toPlatformString())) {
			source = fs.readFileSync(filePath.toPlatformString()).toString()
		} else {
			source = null
		}
		
		this.loadedFiles.set(relativePath.toString(), source)
		return source
	}

	async sourceMapFromLoadedFile(
		relativePath: UnifiedPath,
		filePath: UnifiedPath
	): Promise<SourceMap | null> {
		let sourceMap = this.loadedFilesSourceMapMap.get(relativePath.toString())
		if (sourceMap !== undefined) {
			return sourceMap
		}
		const source = this.loadFile(relativePath, filePath)
		if (source !== null) {
			sourceMap = SourceMap.fromCompiledJSString(filePath, source)
		} else {
			sourceMap = null
		}
		this.loadedFilesSourceMapMap.set(relativePath.toString(), sourceMap)
		return sourceMap
	}

	parseFile(relativePath: UnifiedPath, filePath: UnifiedPath): ProgramStructureTree | null {
		const source = this.loadFile(relativePath, filePath)
		if (source === null) {
			return null
		}
		return TypescriptParser.parseSource(filePath, source)
	}

	async sourceCodeFromId(
		scriptId: ScriptID_string,
		filePath?: UnifiedPath
	): Promise<string | null> {
		if (scriptId === '0') {
			return null
		}
		let source = this.sourceCodeMap.get(scriptId)
		if (source !== undefined) {
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
		scriptId: ScriptID_string
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

	nodeModuleFromPath(
		relativeNodeModulePath: UnifiedPath,
		nodeModulePath: UnifiedPath
	): NodeModule | null {
		let nodeModule = this.nodeModules.get(relativeNodeModulePath.toString())
		if (nodeModule !== undefined) {
			return nodeModule
		}
		nodeModule = NodeModule.fromNodeModulePath(nodeModulePath) || null
		this.nodeModules.set(relativeNodeModulePath.toString(), nodeModule)
		return nodeModule
	}

	async replaceSourceMapById(
		scriptId: ScriptID_string,
		newSourceMap: SourceMap
	) {
		const oldSourceCode = this.sourceCodeMap.get(scriptId)
		if (oldSourceCode === undefined || oldSourceCode === null) {
			throw new Error(`No source code found for scriptId ${scriptId}`)
		}
		const result = SourceMap.base64StringCompiledJSString(oldSourceCode)
		if (result === null || result.base64 === undefined || result.base64 === null) {
			throw new Error(`No source map found for scriptId ${scriptId}`)
		}

		const oldBase64String = result.base64
		const newBase64String = newSourceMap.toBase64String()

		if (oldBase64String === newBase64String) {
			return
		}

		this.sourceCodeMap.set(scriptId, oldSourceCode.replace(oldBase64String, newBase64String))
		this.sourceMapMap.set(scriptId, newSourceMap)
	}

	async replaceSourceMapByLoadedFile(
		relativePath: UnifiedPath,
		newSourceMap: SourceMap
	) {
		const oldSourceCode = this.loadedFiles.get(relativePath.toString())
		if (oldSourceCode === undefined || oldSourceCode === null) {
			throw new Error(`No source code found for relativePath ${relativePath.toString()}`)
		}
		const result = SourceMap.base64StringCompiledJSString(oldSourceCode)
		if (result === null || result.base64 === undefined || result.base64 === null) {
			throw new Error(`No source map found for relativePath ${relativePath.toString()}`)
		}

		const oldBase64String = result.base64
		const newBase64String = newSourceMap.toBase64String()

		if (oldBase64String === newBase64String) {
			return
		}

		this.loadedFiles.set(relativePath.toString(), oldSourceCode.replace(oldBase64String, newBase64String))
		this.loadedFilesSourceMapMap.set(relativePath.toString(), newSourceMap)
	}
}