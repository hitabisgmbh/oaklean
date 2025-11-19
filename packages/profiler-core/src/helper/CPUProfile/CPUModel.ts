import { CPUNode } from './CPUNode'
import { CPUProfileSourceLocation } from './CPUProfileSourceLocation'

import { PermissionHelper } from '../PermissionHelper'
import {
	IComputedNode,
	IProfileModel,
	buildModel
} from '../../../lib/vscode-js-profile-core/src/cpu/model'
import { ICpuProfileRaw } from '../../../lib/vscode-js-profile-core/src/cpu/types'
import { UnifiedPath } from '../../system/UnifiedPath'
import { MetricsDataCollection } from '../../model/interfaces/MetricsDataCollection'
import { JSONHelper } from '../JSONHelper'
// Types
import {
	NanoSeconds_BigInt,
	MicroSeconds_number,
	MilliJoule_number,
	EnergyValuesType
} from '../../types'

export class CPUModel {
	private rootDir: UnifiedPath
	private cpuModel: IProfileModel
	private sourceLocations: CPUProfileSourceLocation[]

	private _cpuProfilerBeginTime: NanoSeconds_BigInt
	private _startTime: number
	private _endTime: number
	private _energyValuesPerNode: [MilliJoule_number, MilliJoule_number][] | undefined
	private _cpuNodes: Map<number, CPUNode>

	private _profilerHitsPerNode: number[]

	constructor(
		rootDir: UnifiedPath,
		profile: ICpuProfileRaw,
		highResolutionBeginTime: NanoSeconds_BigInt
	) {
		this.rootDir = rootDir
		this._startTime = profile.startTime
		this._endTime = profile.endTime
		this.cpuModel = buildModel(profile)
		this.sourceLocations = this.cpuModel.locations.map((
			location
		) => new CPUProfileSourceLocation(
			this.rootDir,
			location.id,
			location.callFrame
		))


		this._cpuProfilerBeginTime = highResolutionBeginTime
		this._cpuNodes = new Map<number, CPUNode>()
		this._profilerHitsPerNode = new Array(this.INodes.length).fill(0)
		for (const sampleId of this.cpuModel.samples) {
			this._profilerHitsPerNode[sampleId] += 1
		}
	}

	get profilerHitsPerNode(): number[] {
		return this._profilerHitsPerNode
	}

	set energyValuesPerNode(values: [MilliJoule_number, MilliJoule_number][] | undefined) {
		if (!values || values.length !== this.INodes.length) {
			throw new Error('CPUModel.energyValuesPerNode: node size and energy value size must be the same')
		}
		this._energyValuesPerNode = values
	}

	/**
		 * energyValuesPerNode is a tuple based array
		 * 
		 * index 0 of each tuple represents the cpuEnergy
		 * index 1 of each tuple represents the ramEnergy
		 */
	get energyValuesPerNode(): [MilliJoule_number, MilliJoule_number][] | undefined {
		return this._energyValuesPerNode
	}

	get CPUProfileSourceLocations(): readonly CPUProfileSourceLocation[] {
		return this.sourceLocations
	}

	get INodes(): readonly IComputedNode[] {
		return this.cpuModel.nodes
	}

	get timeDeltas(): readonly MicroSeconds_number[] {
		return this.cpuModel.timeDeltas as MicroSeconds_number[]
	}

	get samples(): readonly number[] {
		return this.cpuModel.samples
	}

	get startTime(): number {
		return this._startTime
	}

	get endTime(): number {
		return this._endTime
	}

	energyValuesPerNodeByMetricsData(metricsDataCollection: MetricsDataCollection):
	[MilliJoule_number, MilliJoule_number][] {
		/**
		 * When the measurement begins, the sensor interface starts first,
		 * and its starting time is stored in (sensorDataBeginTime).
		 * After a while, the V8 CPU profiler starts, and its start time is stored in (this._highResolutionBeginTime).
		 * 
		 * The CPU measurements are stored in multiple intervals,
		 * and all interval lengths are stored in this.timeDeltas[].
		 * 
		 * 																this.timeDeltas[]
		 * 				| - - - - - - - - - | 0 1 2 3 4 5 6 7 8 9 |
		 * 				^									  ^
		 * 				|									  |
		 * 				|					this._highResolutionBeginTime
		 * 				|
		 * 	sensorDataBeginTime 
		 * 
		 * The measurements of the sensor interface are also stored as intervals in (metricsDataCollection.items)
		 * 
		 * 								metricsDataCollection.items
		 * 				| ----- ----- ----- ----- ----- ----- ----|
		 * 
		 * Each line segment represents the duration of a metricsData object (of metricsDataCollection.items)
		 * 
		 */

		/**
		 * energyValuesPerNode is a tuple based array
		 * 
		 * index 0 of each tuple represents the cpuEnergy
		 * index 1 of each tuple represents the ramEnergy
		 */
		const energyValuesPerNode: [MilliJoule_number, MilliJoule_number][] = new Array(this.INodes.length).fill([0,0])
		const sensorDataBeginTime = metricsDataCollection.items[0].startTime
		let offset = (this._cpuProfilerBeginTime - sensorDataBeginTime)
			+ BigInt(this.timeDeltas[0] * 1000) as NanoSeconds_BigInt
		
		if (offset < BigInt(0)) {
			throw new Error('V8 Profile was measured before the sensor interface began to measure')
		}

		let currentItemNumber = 0
		let currentMetricsData = metricsDataCollection.items[currentItemNumber]
		let energyOfMeasuredProcess: [MilliJoule_number, MilliJoule_number] | undefined = undefined

		for (let i = 1; i < this.timeDeltas.length; i++) {
			if (offset > currentMetricsData.duration) {
				if (currentItemNumber >= metricsDataCollection.items.length) {
					throw new Error('The sensor interface did not measure the whole time the V8 Profiler was running')
				}
				offset = offset - currentMetricsData.duration as NanoSeconds_BigInt
				currentMetricsData = metricsDataCollection.items[++currentItemNumber]
				if (currentMetricsData === undefined) {
					break
				}
				energyOfMeasuredProcess = undefined
				i-- // move one step back to begin at the same timeDelta again but with the next metricsData profile
				continue
			}
			if (energyOfMeasuredProcess === undefined) {
				if (currentMetricsData.processIsPresent(metricsDataCollection.pid)) {
					const factor = currentMetricsData.energyPortionOfProcess(metricsDataCollection.pid)
					energyOfMeasuredProcess = [
						factor * currentMetricsData.cpuEnergy() as MilliJoule_number,
						factor * currentMetricsData.ramEnergy() as MilliJoule_number,
					]
				} else {
					// sometimes outputs of a sensor interface do not include the measured process (e.g. powermetrics)
					// It's not clear why this happens, as the PID is present in later reports again.
					// one reason could be that the energy usage of the process was negligible and therefore not present
					energyOfMeasuredProcess = [
						0 as MilliJoule_number,
						0 as MilliJoule_number
					]
				}
			}
			energyValuesPerNode[this.samples[i-1]] = [
				(energyOfMeasuredProcess[EnergyValuesType.CPU] *
				(this.timeDeltas[i] / Number(currentMetricsData.duration))
				) as MilliJoule_number,
				(energyOfMeasuredProcess[EnergyValuesType.RAM] *
					(this.timeDeltas[i] / Number(currentMetricsData.duration))
				) as MilliJoule_number
			]

			offset = offset + BigInt(this.timeDeltas[i] * 1000) as NanoSeconds_BigInt
		}

		return energyValuesPerNode
	}

	getNode(index: number): CPUNode {
		let node: CPUNode | undefined = this._cpuNodes.get(index)
		if (node === undefined) {
			node = new CPUNode(
				index,
				this,
				this.cpuModel.nodes[index]
			)
			this._cpuNodes.set(index, node)
		}
		return node
		
	}

	async storeToFile(filePath: UnifiedPath) {
		await PermissionHelper.writeFileWithStorageFunctionWithUserPermissionAsync(
			filePath,
			async () => {
				await JSONHelper.storeBigJSON(
					filePath,
					this,
					// eslint-disable-next-line
					(key: any, value: any) =>
						typeof value === 'bigint'
							? value.toString()
							: value // return everything else unchanged
					, 2
				)
			}
		)
	}
}