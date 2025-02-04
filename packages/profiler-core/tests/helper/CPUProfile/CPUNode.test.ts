import * as fs from 'fs'

import { CPUModel } from '../../../src/helper/CPUProfile/CPUModel'
import { CPUNode } from '../../../src/helper/CPUProfile/CPUNode'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import {
	NanoSeconds_BigInt,
	MilliJoule_number
} from '../../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ROOT_DIR = CURRENT_DIR.join('..', '..', '..', '..', '..')

describe('CPUNode', () => {
	let cpuModel: CPUModel
	let instance: CPUNode

	beforeEach(() => {
		const cpuProfileFilePath = CURRENT_DIR.join('..', '..', 'model', 'assets', 'CPUProfiles', 'example001.cpunode.cpuprofile').toString()
		const cpuProfile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())

		cpuModel = new CPUModel(
			ROOT_DIR,
			cpuProfile,
			BigInt('2345442642551333') as NanoSeconds_BigInt
		)
		const energyValues: [MilliJoule_number, MilliJoule_number][] = []
		for (let i = 0; i < cpuModel.INodes.length; i++) {
			energyValues.push([i as MilliJoule_number, i+1 as MilliJoule_number])
		}
		cpuModel.energyValuesPerNode = energyValues

		instance = new CPUNode(
			7,
			cpuModel,
			cpuModel.INodes[7]
		)
	})

	it('instance should be an instanceof CPUNode', () => {
		expect(instance instanceof CPUNode).toBeTruthy()
	})

	it('should have a method children()', () => {
		expect(instance.children).toBeTruthy()
	})

	test('cpuTime', () => {
		expect(instance.cpuTime).toEqual({
			selfCPUTime: 0,
			aggregatedCPUTime: 83
		})
	})

	test('sourceLocation', () => {
		expect(instance.sourceLocation).toBe(
			cpuModel.CPUProfileSourceLocations[4]
		)
	})

	test('selfCPUEnergyConsumption', () => {
		expect(instance.selfCPUEnergyConsumption).toBe(7)
	})

	test('selfRAMEnergyConsumption', () => {
		expect(instance.selfRAMEnergyConsumption).toBe(8)
	})

	test('aggregatedEnergyConsumption', () => {
		expect(instance.aggregatedEnergyConsumption).toEqual([15, 17])
	})

	test('cpuEnergyConsumption', () => {
		expect(instance.cpuEnergyConsumption).toEqual({
			selfCPUEnergyConsumption: 7,
			aggregatedCPUEnergyConsumption: 15
		})
	})

	test('ramEnergyConsumption', () => {
		expect(instance.ramEnergyConsumption).toEqual({
			selfRAMEnergyConsumption: 8,
			aggregatedRAMEnergyConsumption: 17
		})
	})
})