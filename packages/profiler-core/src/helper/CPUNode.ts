import { NodeModuleUtils } from './NodeModuleUtils'
import { CPUModel, EnergyValuesType } from './CPUModel'

import { LangInternalSourceNodeRegExpRegexString } from '../constants/SourceNodeRegex'
import { NodeModule } from '../model/NodeModule'
import { IComputedNode, ILocation } from '../../lib/vscode-js-profile-core/src/cpu/model'
import { SourceNodeIdentifier_string } from '../types/SourceNodeIdentifiers.types'
import { UnifiedPath } from '../system/UnifiedPath'
import { IPureCPUTime, IPureCPUEnergyConsumption, IPureRAMEnergyConsumption } from '../model/SensorValues'
import { MilliJoule_number } from '../model/interfaces/BaseMetricsData'

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
	private _isExtern?: boolean

	private _rawUrl?: string
	private _url?: UnifiedPath
	private _relativeUrl?: UnifiedPath
	private _nodeModulePath?: UnifiedPath | null
	private _nodeModule?: NodeModule | null
	private _relativeSourceFilePath?: UnifiedPath

	private _sourceNodeIdentifier?: SourceNodeIdentifier_string

	private _isWithinTypescriptFile?: boolean
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
			selfCPUTime: this.cpuNode.selfTime,
			aggregatedCPUTime: this.cpuNode.aggregateTime
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

	get rawUrl() {
		if (this._rawUrl === undefined) {
			this._rawUrl = this.ISourceLocation.callFrame.url
		}
		return this._rawUrl
	}

	get url() {
		if (this._url === undefined) {
			this._url = new UnifiedPath(this.rawUrl)
		}
		return this._url
	}

	get relativeUrl() {
		if (this._relativeUrl === undefined) {
			if (this.url.isRelative()) {
				this._relativeUrl = this.url.copy()
			} else {
				this._relativeUrl = this.rootDir.pathTo(this.url)
			}
			
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
			this._nodeModule = this.nodeModulePath ? NodeModule.fromNodeModulePath(this.nodeModulePath) : null
			if (this.nodeModulePath && !this._nodeModule) {
				throw new Error('Module could not be found: ' + this.nodeModulePath.toString())
			}
		}
		return this._nodeModule
	}

	get relativeSourceFilePath() {
		if (this._relativeSourceFilePath === undefined) {
			if (!this.nodeModulePath || !this.nodeModule) {
				this._relativeSourceFilePath = this.relativeUrl
			} else {
				if (this.url.isRelative()) {
					this._relativeSourceFilePath = this.nodeModulePath.pathTo(this.rootDir.join(this.url))
				} else {
					this._relativeSourceFilePath = this.nodeModulePath.pathTo(this.url)
				}
			}
		}
		return this._relativeSourceFilePath
	}

	get isExtern() {
		if (this._isExtern === undefined) {
			this._isExtern = (this.nodeModulePath !== null)
		}
		return this._isExtern
	}

	get type(): CPUNodeType {
		if (this.isLangInternal) {
			return CPUNodeType.langInternal
		}
		if (this.isExtern) {
			return CPUNodeType.extern
		}
		return CPUNodeType.intern
	}

	get sourceNodeIdentifier() {
		if (this._sourceNodeIdentifier === undefined) {
			if (RegExpTestRegex.test(this.ISourceLocation.callFrame.functionName)) {
				this._sourceNodeIdentifier = this.ISourceLocation.callFrame.functionName as SourceNodeIdentifier_string
			} else {
				this._sourceNodeIdentifier = this.ISourceLocation.callFrame.functionName.split('.').map(
					(x) => `{${x}}`
				).join('.') as SourceNodeIdentifier_string
			}
		}
		return this._sourceNodeIdentifier
	}

	get isWithinTypescriptFile() {
		if (this._isWithinTypescriptFile === undefined) {
			this._isWithinTypescriptFile = this.relativeUrl.toString().slice(-3) === '.ts'
		}
		return this._isWithinTypescriptFile
	}

	get relativeJavascriptUrl() {
		if (this._relativeJavascriptUrl === undefined) {
			this._relativeJavascriptUrl = new UnifiedPath(this.relativeUrl.toString().slice(0, -3) + '.js')
		}
		return this._relativeJavascriptUrl
	}

	get javascriptUrl() {
		if (this._javascriptUrl === undefined) {
			this._javascriptUrl = new UnifiedPath(this.url.toString().slice(0, -3) + '.js')
		}
		return this._javascriptUrl
	}

	*children() {
		for (const childId of this.cpuNode.children) {
			yield this.cpuModel.getNode(childId)
		}
	}
}
