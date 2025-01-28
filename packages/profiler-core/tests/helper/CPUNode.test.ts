import * as fs from 'fs'

import { CPUModel } from '../../src/helper/CPUModel'
import { CPUNode } from '../../src/helper/CPUNode'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import {
	NanoSeconds_BigInt,
	MilliJoule_number
} from '../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ROOT_DIR = CURRENT_DIR.join('..', '..', '..', '..')

describe('CPUNode', () => {
	let instance: CPUNode

	beforeEach(() => {
		const cpuProfileFilePath = CURRENT_DIR.join('..', 'model', 'assets', 'CPUProfiles', 'example001.cpunode.cpuprofile').toString()
		const cpuProfile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())

		const cpuModel = new CPUModel(
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
			ROOT_DIR,
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

	test('ISourceLocation', () => {
		expect(instance.ISourceLocation).toEqual({
			id: 4,
			selfTime: 0,
			aggregateTime: 83,
			ticks: 0,
			category: 2,
			callFrame: {
				functionName: 'startProfiling',
				scriptId: 612,
				bailoutReason: '',
				url: 'node_modules/v8-profiler-next/dispatch.js',
				lineNumber: 249,
				columnNumber: 28
			},
			src: {
				lineNumber: 250,
				columnNumber: 29,
				source: {
					name: 'node_modules/v8-profiler-next/dispatch.js',
					path: 'node_modules/v8-profiler-next/dispatch.js',
					sourceReference: 0
				}
			}
		})
	})

	test('sourceLocation', () => {
		expect(instance.sourceLocation).toEqual({
			lineNumber: 249,
			columnNumber: 28
		})
	})

	test('isLangInternal', () => {
		expect(instance.isLangInternal).toEqual(false)
	})

	test('isEmpty', () => {
		expect(instance.isEmpty).toEqual(false)
	})

	test('rawUrl', () => {
		expect(instance.rawUrl).toEqual('node_modules/v8-profiler-next/dispatch.js')
	})

	test('absoluteUrl', () => {
		expect(instance.absoluteUrl.toString()).toEqual(ROOT_DIR.join('./node_modules/v8-profiler-next/dispatch.js').toString())
	})

	test('relativeUrl', () => {
		expect(instance.relativeUrl.toString()).toBe('./node_modules/v8-profiler-next/dispatch.js')
	})

	test('nodeModulePath', () => {
		expect(instance.nodeModulePath?.toString()).toBe(ROOT_DIR.join('node_modules/v8-profiler-next').toString())
	})

	test('nodeModule', () => {
		expect(instance.nodeModule).toEqual({
			name: 'v8-profiler-next',
			version: '1.10.0'
		})
	})

	test('relativeSourceFilePath', () => {
		expect(instance.relativeSourceFilePath.toString()).toBe('./dispatch.js')
	})

	test('isExtern', () => {
		expect(instance.isExtern).toBe(true)
	})

	test('sourceNodeIdentifier', () => {
		expect(instance.sourceNodeIdentifier).toBe('{startProfiling}')
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