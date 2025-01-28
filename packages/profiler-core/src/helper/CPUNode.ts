import { NodeModuleUtils } from './NodeModuleUtils'
import { CPUModel } from './CPUModel'
import { UrlProtocolHelper } from './UrlProtocolHelper'
import { ExternalResourceHelper } from './ExternalResourceHelper'

import { LangInternalSourceNodeRegExpRegexString } from '../constants/SourceNodeRegex'
import { NodeModule } from '../model/NodeModule'
import { IComputedNode, ILocation } from '../../lib/vscode-js-profile-core/src/cpu/model'
import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	MilliJoule_number,
	SourceNodeIdentifier_string,
	IPureCPUTime,
	IPureCPUEnergyConsumption,
	IPureRAMEnergyConsumption,
	EnergyValuesType,
	MicroSeconds_number,
	ScriptID_string
} from '../types'

export const RegExpTestRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)

export enum CPUNodeType {
	extern = 'extern',
	intern ='intern',
	langInternal = 'lang_internal'
}

export class CPUNode {
	private _index: number

	private cpuModel: CPUModel
	private rootDir: UnifiedPath
	private cpuNode: IComputedNode

	private _aggregatedEnergyConsumption: [MilliJoule_number, MilliJoule_number] | undefined

	private _sourceLocation?: ILocation
	private _isEmpty?: boolean
	private _isLangInternal?: boolean
	private _isWASM?: boolean
	private _isWebpack?: boolean
	private _isExtern?: boolean

	private _scriptID?: ScriptID_string
	private _rawUrl?: string
	private _absoluteUrl?: UnifiedPath
	private _relativeUrl?: UnifiedPath
	private _nodeModulePath?: UnifiedPath | null
	private _nodeModule?: NodeModule | null
	private _relativeSourceFilePath?: UnifiedPath

	private _sourceNodeIdentifier?: SourceNodeIdentifier_string

	private _javascriptUrl?: UnifiedPath
	private _relativeJavascriptUrl?: UnifiedPath

	constructor(
		index: number,
		cpuModel: CPUModel,
		rootDir: UnifiedPath,
		node: IComputedNode
	) {
		this._index = index
		this.cpuModel = cpuModel
		this.rootDir = rootDir
		this.cpuNode = node
	}

	get externalResourceHelper(): ExternalResourceHelper {
		return this.cpuModel.externalResourceHelper
	}

	get profilerHits(): number {
		return this.cpuModel.profilerHitsPerNode[this.index]
	}

	get selfCPUEnergyConsumption(): MilliJoule_number {
		return this.cpuModel.energyValuesPerNode ?
			this.cpuModel.energyValuesPerNode[this.index][EnergyValuesType.CPU] : 0 as MilliJoule_number
	}

	get selfRAMEnergyConsumption(): MilliJoule_number {
		return this.cpuModel.energyValuesPerNode ?
			this.cpuModel.energyValuesPerNode[this.index][EnergyValuesType.RAM] : 0 as MilliJoule_number
	}

	get aggregatedEnergyConsumption(): [MilliJoule_number, MilliJoule_number] {
		if (this._aggregatedEnergyConsumption) {
			return this._aggregatedEnergyConsumption
		}

		let totalCPU = this.selfCPUEnergyConsumption
		let totalRAM = this.selfRAMEnergyConsumption
		for (const child of this.children()) {
			totalCPU = totalCPU + child.aggregatedEnergyConsumption[EnergyValuesType.CPU] as MilliJoule_number
			totalRAM = totalRAM + child.aggregatedEnergyConsumption[EnergyValuesType.RAM] as MilliJoule_number
		}

		return (this._aggregatedEnergyConsumption = [totalCPU, totalRAM])
	}

	get cpuEnergyConsumption(): IPureCPUEnergyConsumption {
		return {
			selfCPUEnergyConsumption: this.selfCPUEnergyConsumption,
			aggregatedCPUEnergyConsumption: this.aggregatedEnergyConsumption[EnergyValuesType.CPU]
		}
	}

	get ramEnergyConsumption(): IPureRAMEnergyConsumption {
		return {
			selfRAMEnergyConsumption: this.selfRAMEnergyConsumption,
			aggregatedRAMEnergyConsumption: this.aggregatedEnergyConsumption[EnergyValuesType.RAM]
		}
	}

	get index(): number {
		return this._index
	}

	get cpuTime(): IPureCPUTime {
		return {
			selfCPUTime: this.cpuNode.selfTime as MicroSeconds_number,
			aggregatedCPUTime: this.cpuNode.aggregateTime as MicroSeconds_number
		}
	}

	get ISourceLocation() {
		if (this._sourceLocation === undefined) {
			this._sourceLocation = this.cpuModel.ILocations[this.cpuNode.locationId]
		}
		return this._sourceLocation
	}

	get sourceLocation() {
		const { lineNumber, columnNumber } = this.ISourceLocation.callFrame
		return {
			lineNumber,
			columnNumber
		}
	}

	get isLangInternal() {
		if (this._isLangInternal === undefined) {
			const sourceLocation = this.ISourceLocation
			this._isLangInternal = sourceLocation.callFrame.url.startsWith('node:') ||
				(sourceLocation.callFrame.url === '' && sourceLocation.callFrame.functionName.length > 0)
		}
		return this._isLangInternal
	}

	get isEmpty() {
		if (this._isEmpty === undefined) {
			this._isEmpty = this.ISourceLocation.callFrame.url === ''
		}
		return this._isEmpty
	}

	get isExtern() {
		if (this._isExtern === undefined) {
			this._isExtern = (this.nodeModulePath !== null)
		}
		return this._isExtern
	}

	get isWASM() {
		if (this._isWASM === undefined) {
			this._isWASM = this.ISourceLocation.callFrame.url.startsWith('wasm://')
		}
		return this._isWASM
	}

	get isWebpack() {
		if (this._isWebpack === undefined) {
			this._isWebpack = this.ISourceLocation.callFrame.url.startsWith('webpack://') ||
				this.ISourceLocation.callFrame.url.startsWith('webpack-internal://')
		}
		return this._isWebpack
	}

	get scriptID() {
		if (this._scriptID === undefined) {
			this._scriptID = this.ISourceLocation.callFrame.scriptId.toString() as ScriptID_string
		}
		return this._scriptID
	}

	get rawUrl() {
		if (this._rawUrl === undefined) {
			this._rawUrl = this.ISourceLocation.callFrame.url
		}
		return this._rawUrl
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

	get nodeModulePath() {
		if (this._nodeModulePath === undefined) {
			const modulePath = NodeModuleUtils.getParentModuleFromPath(this.relativeUrl)
			if (modulePath) {
				this._nodeModulePath = this.rootDir.join(modulePath)
			} else {
				this._nodeModulePath = null
			}
		}
		return this._nodeModulePath
	}

	get nodeModule() {
		if (this._nodeModule === undefined) {
			this._nodeModule = this.nodeModulePath ? this.externalResourceHelper.nodeModuleFromPath(
				this.rootDir.pathTo(this.nodeModulePath),
				this.nodeModulePath
			) : null
			if (this.nodeModulePath && !this._nodeModule) {
				throw new Error('Module could not be found: ' + this.nodeModulePath.toString())
			}
		}
		return this._nodeModule
	}

	/**
	 * Returns the relative source file path of the cpu node.
	 * The path is relative to its parent scope (a node module or the root directory)
	 */
	get relativeSourceFilePath() {
		if (this._relativeSourceFilePath === undefined) {
			if (this.isWASM) {
				this._relativeSourceFilePath = new UnifiedPath(this.rawUrl.substring(7)) // remove the 'wasm://' prefix
			} else {
				if (!this.nodeModulePath || !this.nodeModule) {
					this._relativeSourceFilePath = this.relativeUrl
				} else {
					this._relativeSourceFilePath = this.nodeModulePath.pathTo(this.absoluteUrl)
				}
			}
		}
		return this._relativeSourceFilePath
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
			if (RegExpTestRegex.test(this.ISourceLocation.callFrame.functionName)) {
				this._sourceNodeIdentifier = this.ISourceLocation.callFrame.functionName as SourceNodeIdentifier_string
			} else {
				this._sourceNodeIdentifier = this.functionNameToSourceNodeIdentifier(
					this.ISourceLocation.callFrame.functionName
				)
			}
		}
		return this._sourceNodeIdentifier
	}

	*children() {
		for (const childId of this.cpuNode.children) {
			yield this.cpuModel.getNode(childId)
		}
	}
}
