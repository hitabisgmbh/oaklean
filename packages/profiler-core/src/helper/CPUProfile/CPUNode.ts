import { CPUModel } from './CPUModel'

import { IComputedNode } from '../../../lib/vscode-js-profile-core/src/cpu/model'
// Types
import {
	MilliJoule_number,
	IPureCPUTime,
	IPureCPUEnergyConsumption,
	IPureRAMEnergyConsumption,
	EnergyValuesType,
	MicroSeconds_number,
	ISensorValues
} from '../../types'

export enum CPUNodeType {
	extern = 'extern',
	intern ='intern',
	langInternal = 'lang_internal'
}

export class CPUNode {
	private _index: number

	private cpuModel: CPUModel
	private cpuNode: IComputedNode

	private _aggregatedEnergyConsumption: [MilliJoule_number, MilliJoule_number] | undefined

	constructor(
		index: number,
		cpuModel: CPUModel,
		node: IComputedNode
	) {
		this._index = index
		this.cpuModel = cpuModel
		this.cpuNode = node
	}

	get sourceLocation() {
		return this.cpuModel.CPUProfileSourceLocations[this.cpuNode.locationId]
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

	get cpuTime(): IPureCPUTime {
		return {
			selfCPUTime: this.cpuNode.selfTime as MicroSeconds_number,
			aggregatedCPUTime: this.cpuNode.aggregateTime as MicroSeconds_number
		}
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

	// IMPORTANT to change when new measurement type gets added
	get sensorValues(): ISensorValues {
		return {
			...this.cpuTime,
			...this.cpuEnergyConsumption,
			...this.ramEnergyConsumption
		}
	}

	get index(): number {
		return this._index
	}

	*children() {
		for (const childId of this.cpuNode.children) {
			yield this.cpuModel.getNode(childId)
		}
	}
}
