import * as fs from 'fs'
import inspector from 'inspector'

import { LoggerHelper } from './LoggerHelper'
import { PermissionHelper } from './PermissionHelper'
import { TypescriptParser } from './TypescriptParser'
import { GitHelper } from './GitHelper'

import { SourceMap } from '../model/SourceMap'
import { UnifiedPath } from '../system/UnifiedPath'
import { NodeModule } from '../model/NodeModule'
import { ProgramStructureTree } from '../model/ProgramStructureTree'
// Types
import {
	IExternalResourceHelper,
	INodeModule,
	UnifiedPath_string,
	ScriptID_string,
	IExternalResourceFileInfo
} from '../types'
import { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'

export type ExternalResourceFileInfo = {
	sourceCode: string,
	sourceMap?: SourceMap | null,
	cucc?: boolean
}

export class ExternalResourceHelper {
	private _frozen: boolean

	private _session: inspector.Session
	// maps scriptId to source code
	private fileInfoPerScriptID: Map<ScriptID_string, ExternalResourceFileInfo | null>

	// loaded files from the file system
	private fileInfoPerPath: Map<UnifiedPath_string, ExternalResourceFileInfo | null> // null represents that the file was not found

	// loaded node modules
	private nodeModules: Map<UnifiedPath_string, NodeModule | null> // null represents that the node module was not found

	// uncommitted files
	// null represents that the uncommitted files could not be determined
	private _uncommittedFiles: UnifiedPath_string[] | undefined | null

	constructor() {
		this._frozen = false
		this._session = new inspector.Session()
		this.fileInfoPerScriptID = new Map()
		this.fileInfoPerPath = new Map()
		this.nodeModules = new Map()
	}

	get isFrozen() {
		return this._frozen
	}

	get scriptIDs() {
		return Array.from(this.fileInfoPerScriptID.keys())
	}

	get loadedFilePaths() {
		return Array.from(this.fileInfoPerPath.keys())
	}

	get uncommittedFiles() {
		return this._uncommittedFiles
	}

	trackUncommittedFiles(rootDir: UnifiedPath) {
		if (this._uncommittedFiles === undefined) {
			const uncommittedFiles = GitHelper.uncommittedFiles()

			if (uncommittedFiles === null) {
				this._uncommittedFiles = null
			} else {
				this._uncommittedFiles = []
				for (const file of uncommittedFiles) {
					const relativePath = rootDir.pathTo(new UnifiedPath(file)).toString()
					const fileInfo = this.fileInfoPerPath.get(relativePath)
					if (fileInfo !== undefined && fileInfo !== null) {
						fileInfo.cucc = true
					}

					this._uncommittedFiles.push(relativePath)
				}
			}
		}
		return this._uncommittedFiles
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
	): ExternalResourceHelper | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return ExternalResourceHelper.fromJSON(
			fs.readFileSync(filePath.toPlatformString()).toString()
		)
	}

	toJSON(): IExternalResourceHelper {
		const fileInfoPerScriptID: Record<ScriptID_string, IExternalResourceFileInfo | null> = {}
		for (const [key, value] of this.fileInfoPerScriptID.entries()) {
			if (value === null) {
				fileInfoPerScriptID[key] = null
				continue
			}
			const fileInfo: IExternalResourceFileInfo = {
				sourceCode: value.sourceCode
			}
			if (value.cucc !== undefined) {
				fileInfo.cucc = value.cucc
			}
			fileInfoPerScriptID[key] = fileInfo
		}

		const fileInfoPerPath: Record<UnifiedPath_string, IExternalResourceFileInfo | null> = {}
		for (const [key, value] of this.fileInfoPerPath.entries()) {
			if (value === null) {
				fileInfoPerPath[key] = null
				continue
			}
			const fileInfo: IExternalResourceFileInfo = {
				sourceCode: value.sourceCode
			}
			if (value.cucc !== undefined) {
				fileInfo.cucc = value.cucc
			}
			fileInfoPerPath[key] = fileInfo
		}

		const nodeModules: Record<UnifiedPath_string, INodeModule | null> = {}
		for (const [key, value] of this.nodeModules.entries()) {
			if (value === null) {
				nodeModules[key] = null
				continue
			}
			nodeModules[key] = value.toJSON()
		}

		return {
			fileInfoPerScriptID,
			fileInfoPerPath,
			nodeModules
		}
	}

	static fromJSON(
		json: string | IExternalResourceHelper
	) {
		let data: IExternalResourceHelper
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new ExternalResourceHelper()
		for (const [key, value] of Object.entries(data.fileInfoPerScriptID)) {
			let fileInfo: ExternalResourceFileInfo | null = null
			if (value !== null) {
				fileInfo = {
					sourceCode: value.sourceCode
				}
				if (value.cucc !== undefined) {
					fileInfo.cucc = value.cucc
				}
			}

			result.fileInfoPerScriptID.set(key as ScriptID_string, fileInfo)
		}

		for (const [key, value] of Object.entries(data.fileInfoPerPath)) {
			let fileInfo: ExternalResourceFileInfo | null = null
			if (value !== null) {
				fileInfo = {
					sourceCode: value.sourceCode
				}
				if (value.cucc !== undefined) {
					fileInfo.cucc = value.cucc
				}
			}

			result.fileInfoPerPath.set(key as UnifiedPath_string, fileInfo)
		}

		for (const [key, value] of Object.entries(data.nodeModules)) {
			result.nodeModules.set(
				key as UnifiedPath_string,
				value !== null ? NodeModule.fromJSON(value) : null
			)
		}

		// freeze the object to prevent further modifications
		result._frozen = true

		return result
	}

	async listen() {
		await this._session.on('inspectorNotification', async (message) => {
			if (message.method === 'Debugger.scriptParsed') {
				const params = message.params as {
					url: string,
					scriptId: ScriptID_string
				}
				// store source code for later use
				await this.fileInfoFromScriptID(params.scriptId)
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
			promises.push(this.sourceMapFromScriptID(scriptId, new UnifiedPath(filePath)))
		}

		await Promise.all(promises)
	}

	fileInfoFromPath(
		relativePath: UnifiedPath | UnifiedPath_string,
		filePath: UnifiedPath | UnifiedPath_string
	): ExternalResourceFileInfo | null {
		const relativePathString = typeof relativePath === 'string' ? relativePath : relativePath.toString()
		const filePathPlatformString = typeof filePath === 'string' ? filePath : filePath.toPlatformString()

		let fileInfo = this.fileInfoPerPath.get(relativePathString)
		if (fileInfo !== undefined) {
			return fileInfo
		}
		if (this.isFrozen) {
			throw new Error(
				'ExternalResourceHelper.fileInfoFromPath: Cannot load file while frozen' + 
				'Tried to access: ' + relativePathString
			)
		}
		if (fs.existsSync(filePathPlatformString)) {
			fileInfo = {
				sourceCode: fs.readFileSync(filePathPlatformString).toString()
			}
		} else {
			fileInfo = null
		}
		
		this.fileInfoPerPath.set(relativePathString, fileInfo)
		return fileInfo
	}

	sourceCodeFromPath(
		relativePath: UnifiedPath | UnifiedPath_string,
		filePath: UnifiedPath | UnifiedPath_string,
	): string | null {
		const fileInfo = this.fileInfoFromPath(relativePath, filePath)
		if (fileInfo === null) {
			return null
		}
		return fileInfo.sourceCode
	}

	async sourceMapFromPath(
		relativePath: UnifiedPath | UnifiedPath_string,
		filePath: UnifiedPath,
	): Promise<SourceMap | null> {
		const fileInfo = this.fileInfoFromPath(relativePath, filePath)
		if (fileInfo === null) {
			return null
		}
		if (fileInfo.sourceMap !== undefined) {
			return fileInfo.sourceMap
		}
		fileInfo.sourceMap = SourceMap.fromCompiledJSString(filePath, fileInfo.sourceCode)
		return fileInfo.sourceMap
	}

	parseFile(
		relativePath: UnifiedPath | UnifiedPath_string,
		filePath: UnifiedPath | UnifiedPath_string,
	): ProgramStructureTree | null {
		const fileInfo = this.fileInfoFromPath(relativePath, filePath)
		if (fileInfo === null) {
			return null
		}
		return TypescriptParser.parseSource(filePath, fileInfo.sourceCode)
	}

	async fileInfoFromScriptID(
		scriptID: ScriptID_string,
		filePath?: UnifiedPath
	): Promise<ExternalResourceFileInfo | null> {
		if (scriptID === '0') {
			return null
		}
		let fileInfo = this.fileInfoPerScriptID.get(scriptID)
		if (fileInfo !== undefined) {
			return fileInfo
		}

		if (this.isFrozen) {
			throw new Error(
				'ExternalResourceHelper.fileInfoFromScriptID: Cannot script from inspector while frozen\n' + 
				'Tried to access: ' + scriptID
			)
		}

		const result = await (new Promise<
		{
			source: string,
			err?: Error
		}
		>((resolve) => {
			this._session.post('Debugger.getScriptSource', { scriptId: scriptID }, (err, args) => {
				if (err) {
					resolve({ source: '', err })
				} else {
					resolve({ source: args.scriptSource })
				}
			})
		}))
		if (result.err) {
			LoggerHelper.error('Error getting script source', result.err, { scriptId: scriptID, filePath })
			throw result.err
		}
		fileInfo = {
			sourceCode: result.source
		}
		this.fileInfoPerScriptID.set(scriptID, fileInfo)
		return fileInfo
	}

	async sourceCodeFromScriptID(scriptID: ScriptID_string): Promise<string | null> {
		const fileInfo = await this.fileInfoFromScriptID(scriptID)
		if (fileInfo === null) {
			return null
		}
		return fileInfo.sourceCode
	}

	async sourceMapFromScriptID(
		scriptID: ScriptID_string,
		filePath: UnifiedPath
	): Promise<SourceMap | null> {
		const fileInfo = await this.fileInfoFromScriptID(scriptID, filePath)
		if (fileInfo === null || fileInfo.sourceMap === null) {
			return null
		}
		if (fileInfo.sourceMap !== undefined) {
			return fileInfo.sourceMap
		}
		fileInfo.sourceMap = SourceMap.fromCompiledJSString(filePath, fileInfo.sourceCode)
		return fileInfo.sourceMap
	}

	nodeModuleFromPath(
		relativeNodeModulePath: UnifiedPath,
		nodeModulePath: UnifiedPath
	): NodeModule | null {
		let nodeModule = this.nodeModules.get(relativeNodeModulePath.toString())
		if (nodeModule !== undefined) {
			return nodeModule
		}
		if (this.isFrozen) {
			throw new Error(
				'ExternalResourceHelper.nodeModuleFromPath: Cannot load node modules while frozen\n' +
				'Tried to access: ' + relativeNodeModulePath.toString()
			)
		}
		nodeModule = NodeModule.fromNodeModulePath(nodeModulePath) || null
		this.nodeModules.set(relativeNodeModulePath.toString(), nodeModule)
		return nodeModule
	}

	async replaceSourceMapByScriptID(
		scriptID: ScriptID_string,
		newSourceMap: SourceMap
	) {
		const fileInfo = await this.fileInfoFromScriptID(scriptID)
		if (fileInfo === null) {
			throw new Error(`No source code found for scriptID ${scriptID}`)
		}
		const result = SourceMap.base64StringCompiledJSString(fileInfo.sourceCode)
		if (result === null || result.base64 === undefined || result.base64 === null) {
			throw new Error(`No source map found for scriptID ${scriptID}`)
		}

		const oldBase64String = result.base64
		const newBase64String = newSourceMap.toBase64String()

		if (oldBase64String === newBase64String) {
			return
		}
		fileInfo.sourceCode = fileInfo.sourceCode.replace(oldBase64String, newBase64String)
		fileInfo.sourceMap = newSourceMap
	}

	async replaceSourceMapByLoadedFile(
		relativePath: UnifiedPath,
		newSourceMap: SourceMap
	) {
		const fileInfo = this.fileInfoFromPath(relativePath, relativePath)
		if (fileInfo === null) {
			throw new Error(`No source code found for relativePath ${relativePath.toString()}`)
		}
		const result = SourceMap.base64StringCompiledJSString(fileInfo.sourceCode)
		if (result === null || result.base64 === undefined || result.base64 === null) {
			throw new Error(`No source map found for relativePath ${relativePath.toString()}`)
		}

		const oldBase64String = result.base64
		const newBase64String = newSourceMap.toBase64String()

		if (oldBase64String === newBase64String) {
			return
		}
		fileInfo.sourceCode = fileInfo.sourceCode.replace(oldBase64String, newBase64String)
		fileInfo.sourceMap = newSourceMap
	}
}