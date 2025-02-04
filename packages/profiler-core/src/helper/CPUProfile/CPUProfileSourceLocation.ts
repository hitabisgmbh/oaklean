import { LangInternalSourceNodeRegExpRegexString } from '../../constants/SourceNodeRegex'
import { UnifiedPath } from '../../system/UnifiedPath'
import { UrlProtocolHelper } from '../UrlProtocolHelper'
import { ILocation } from '../../../lib/vscode-js-profile-core/src/cpu/model'
// Types
import {
	ScriptID_string,
	SourceNodeIdentifier_string,
	CPUProfileSourceLocationType
} from '../../types'

export const RegExpTestRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)

export class CPUProfileSourceLocation {
	private _index: number

	private _sourceLocation: ILocation

	// extended fields
	private _rootDir: UnifiedPath

	private _type: CPUProfileSourceLocationType
	private _scriptID: ScriptID_string
	private _rawUrl: string
	private _absoluteUrl?: UnifiedPath
	private _relativeUrl?: UnifiedPath
	private _sourceNodeIdentifier?: SourceNodeIdentifier_string

	constructor(
		rootDir: UnifiedPath,
		sourceLocation: ILocation
	) {
		this._index = sourceLocation.id
		this._sourceLocation = sourceLocation
		this._rootDir = rootDir

		// determine the type of the source location
		if (
			sourceLocation.callFrame.url.startsWith('node:') ||
			(sourceLocation.callFrame.url === '' && sourceLocation.callFrame.functionName.length > 0)
		) {
			this._type = CPUProfileSourceLocationType.LANG_INTERNAL
		} else if (sourceLocation.callFrame.url.startsWith('wasm://')) {
			this._type = CPUProfileSourceLocationType.WASM
		} else if (
			sourceLocation.callFrame.url.startsWith('webpack://') ||
			sourceLocation.callFrame.url.startsWith('webpack-internal://')
		) {
			this._type = CPUProfileSourceLocationType.WEBPACK
		} else if (sourceLocation.callFrame.url === '') {
			// important that this the last check, since node internal urls are also sometimes empty
			this._type = CPUProfileSourceLocationType.EMPTY
		} else {
			this._type = CPUProfileSourceLocationType.DEFAULT
		}
		
		// determine the script id
		this._scriptID = this.ISourceLocation.callFrame.scriptId.toString() as ScriptID_string

		// determine the pure url
		this._rawUrl = this.ISourceLocation.callFrame.url
	}

	private get rootDir() {
		return this._rootDir
	}

	private get ISourceLocation() {
		return this._sourceLocation
	}

	get index() {
		return this._index
	}

	get sourceLocation() {
		const { lineNumber, columnNumber } = this.ISourceLocation.callFrame
		return {
			lineNumber,
			columnNumber
		}
	}

	get isLangInternal() {
		return this._type === CPUProfileSourceLocationType.LANG_INTERNAL
	}

	get isEmpty() {
		return this._type === CPUProfileSourceLocationType.EMPTY
	}

	get isWASM() {
		return this._type === CPUProfileSourceLocationType.WASM
	}

	get isWebpack() {
		return this._type === CPUProfileSourceLocationType.WEBPACK
	}

	get scriptID() {
		return this._scriptID
	}

	get rawUrl() {
		return this._rawUrl
	}

	get rawFunctionName() {
		return this.ISourceLocation.callFrame.functionName
	}

	get absoluteUrl() {
		if (this._absoluteUrl === undefined) {
			let url: UnifiedPath
			if (
				this.rawUrl.startsWith('file://')
			) {
				// remove the 'file://' prefix
				url = new UnifiedPath(this.rawUrl.slice(7))
			} else if (
				this.isWebpack
			) {
				// extract the file path from a webpack-internal url
				const result = UrlProtocolHelper.parseWebpackSourceUrl(this.rawUrl)
				if (result !== null) {
					url = new UnifiedPath(result.filePath)
				} else {
					throw new Error('Could not parse webpack-internal url: ' + this.rawUrl)
				}
			} else {
				url = new UnifiedPath(this.rawUrl)
			}
			if (url.isRelative()) {
				this._absoluteUrl = this.rootDir.join(url)
			} else {
				this._absoluteUrl = url
			}
		}
		return this._absoluteUrl
	}

	get relativeUrl() {
		if (this._relativeUrl === undefined) {
			this._relativeUrl = this.rootDir.pathTo(this.absoluteUrl)
		}
		return this._relativeUrl
	}

	private functionNameToSourceNodeIdentifier(functionName: string) {
		const chunks = []

		let chunk = ''
		let lastChar = ''
		for (const char of functionName) {
			if (char === '.') {
				if (lastChar === '.') {
					chunk += char
				} else {
					chunks.push(`{${chunk}}`)
					chunk = ''
				}
			} else {
				chunk += char
			}
			lastChar = char
		}
		chunks.push(`{${chunk}}`)
		return chunks.join('.') as SourceNodeIdentifier_string
	}

	get sourceNodeIdentifier() {
		if (this._sourceNodeIdentifier === undefined) {
			if (RegExpTestRegex.test(this.rawFunctionName)) {
				this._sourceNodeIdentifier = this.rawFunctionName as SourceNodeIdentifier_string
			} else {
				this._sourceNodeIdentifier = this.functionNameToSourceNodeIdentifier(
					this.rawFunctionName
				)
			}
		}
		return this._sourceNodeIdentifier
	}
}
