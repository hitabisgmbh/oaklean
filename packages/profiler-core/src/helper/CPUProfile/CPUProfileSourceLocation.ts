import { Protocol as Cdp } from 'devtools-protocol'

import { SourceNodeIdentifierHelper } from '../SourceNodeIdentifierHelper'
import { LangInternalSourceNodeRegExpRegexString } from '../../constants/SourceNodeRegex'
import { UnifiedPath } from '../../system/UnifiedPath'
import { UrlProtocolHelper } from '../UrlProtocolHelper'
// Types
import {
	ScriptID_string,
	SourceNodeIdentifier_string,
	CPUProfileSourceLocationType
} from '../../types'

export const RegExpTestRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)

export class CPUProfileSourceLocation {
	private _index: number

	private _callFrame: Cdp.Runtime.CallFrame

	// extended fields
	private _rootDir: UnifiedPath

	private _type: CPUProfileSourceLocationType
	private _isEmpty: boolean
	private _scriptID: ScriptID_string
	private _rawUrl: string
	private _absoluteUrl?: UnifiedPath
	private _relativeUrl?: UnifiedPath
	private _sourceNodeIdentifier?: SourceNodeIdentifier_string

	constructor(
		rootDir: UnifiedPath,
		locationId: number,
		callFrame: Cdp.Runtime.CallFrame
	) {
		this._index = locationId
		this._callFrame = callFrame
		this._rootDir = rootDir
		this._isEmpty = false

		// determine the type of the source location
		if (
			this.callFrame.scriptId === '0' ||
			this.callFrame.url.startsWith('node:')
		) {
			this._type = CPUProfileSourceLocationType.LANG_INTERNAL
		} else if (this.callFrame.url.startsWith('wasm://')) {
			this._type = CPUProfileSourceLocationType.WASM
		} else if (
			this.callFrame.url.startsWith('webpack://') ||
			this.callFrame.url.startsWith('webpack-internal://')
		) {
			this._type = CPUProfileSourceLocationType.WEBPACK
		} else {
			this._type = CPUProfileSourceLocationType.DEFAULT
			this._isEmpty = (this.callFrame.url === '')
		}
		
		// determine the script id
		this._scriptID = this.callFrame.scriptId.toString() as ScriptID_string

		// determine the pure url
		this._rawUrl = this.callFrame.url
	}

	private get rootDir() {
		return this._rootDir
	}

	private get callFrame() {
		return this._callFrame
	}

	get index() {
		return this._index
	}

	get sourceLocation() {
		const { lineNumber, columnNumber } = this.callFrame
		return {
			lineNumber,
			columnNumber
		}
	}

	get isLangInternal() {
		return this._type === CPUProfileSourceLocationType.LANG_INTERNAL
	}

	get isEmpty() {
		return this._isEmpty
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
		return this.callFrame.functionName
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

	get sourceNodeIdentifier() {
		if (this._sourceNodeIdentifier === undefined) {
			if (RegExpTestRegex.test(this.rawFunctionName)) {
				this._sourceNodeIdentifier = this.rawFunctionName as SourceNodeIdentifier_string
			} else {
				this._sourceNodeIdentifier = SourceNodeIdentifierHelper.functionNameToSourceNodeIdentifier(
					this.rawFunctionName
				)
			}
		}
		return this._sourceNodeIdentifier
	}
}
