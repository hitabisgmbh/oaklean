import * as fs from 'fs'

import { MicroSeconds_number, NanoSeconds_BigInt, UnifiedPath } from '@oaklean/profiler-core'

import { PerfEvent, PerfSensorInterface } from '../../../src/interfaces/perf/PerfSensorInterface'

const CURRENT_DIR = new UnifiedPath(__dirname)

const OUTPUT_CONTENT_CORES_RAM = fs.readFileSync(CURRENT_DIR.join('assets', 'cores+ram.txt').toPlatformString()).toString()
const OUTPUT_CONTENT_CORES = fs.readFileSync(CURRENT_DIR.join('assets', 'cores.txt').toPlatformString()).toString()
const OUTPUT_CONTENT_RAM = fs.readFileSync(CURRENT_DIR.join('assets', 'ram.txt').toPlatformString()).toString()

const COLLECTION_CORES_RAM = JSON.parse(fs.readFileSync(CURRENT_DIR.join('assets', 'cores+ram.collection.json').toPlatformString()).toString())
const COLLECTION_CORES = JSON.parse(fs.readFileSync(CURRENT_DIR.join('assets', 'cores.collection.json').toPlatformString()).toString())
const COLLECTION_RAM = JSON.parse(fs.readFileSync(CURRENT_DIR.join('assets', 'ram.collection.json').toPlatformString()).toString())

function mock_checkEventAvailability(events: PerfEvent[]) {
	return jest.fn().mockImplementation((eventName: PerfEvent) => {
		return events.includes(eventName)
	})
}

describe('PerfSensorInterface', () => {
	describe('availableMeasurementTypes', () => {
		let instance: PerfSensorInterface
		beforeEach(() => {
			instance = new PerfSensorInterface({
				outputFilePath: '',
				sampleInterval: 0 as MicroSeconds_number
			}, {
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt
			})
		})

		test('perf events energy-cores and energy-ram available', async () => {
			
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES,
				PerfEvent.ENERGY_RAM
			])

			expect(await instance.availableMeasurementTypes()).toEqual({
				[PerfEvent.ENERGY_CORES]: true,
				[PerfEvent.ENERGY_RAM]: true
			})
		})

		test('only perf event energy-cores available', async () => {
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES
			])

			expect(await instance.availableMeasurementTypes()).toEqual({
				[PerfEvent.ENERGY_CORES]: true,
				[PerfEvent.ENERGY_RAM]: false
			})
		})

		test('only perf event energy-ram available', async () => {
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_RAM
			])

			expect(await instance.availableMeasurementTypes()).toEqual({
				[PerfEvent.ENERGY_CORES]: false,
				[PerfEvent.ENERGY_RAM]: true
			})
		})
	})

	describe('commandLineArgs', () => {
		let instance: PerfSensorInterface
		beforeEach(() => {
			instance = new PerfSensorInterface({
				outputFilePath: '',
				sampleInterval: 0 as MicroSeconds_number
			}, {
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt
			})
		})

		test('perf events energy-cores and energy-ram available', async () => {
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES,
				PerfEvent.ENERGY_RAM
			])

			expect(await instance.commandLineArgs()).toEqual([
				'stat',
				'-e', 'power/energy-cores/',
				'-e', 'power/energy-ram/',
				'-x', '\'|\'',
				'-I', '0',
				'-o', ''
			])
		})

		test('only perf event energy-cores available', async () => {
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES
			])

			expect(await instance.commandLineArgs()).toEqual([
				'stat',
				'-e', 'power/energy-cores/',
				'-x', '\'|\'',
				'-I', '0',
				'-o', ''
			])
		})

		test('only perf event energy-ram available', async () => {
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_RAM
			])

			expect(await instance.commandLineArgs()).toEqual([
				'stat',
				'-e', 'power/energy-ram/',
				'-x', '\'|\'',
				'-I', '0',
				'-o', ''
			])
		})
	})

	describe('readSensorValues', () => {
		let instance: PerfSensorInterface
		beforeEach(() => {
			instance = new PerfSensorInterface({
				outputFilePath: '',
				sampleInterval: 0 as MicroSeconds_number
			}, {
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt
			})
		})

		test('perf events energy-cores and energy-ram available', async () => {
			instance.getOutputContent = jest.fn().mockReturnValue(OUTPUT_CONTENT_CORES_RAM)
			instance.isRunning = jest.fn().mockReturnValue(false)
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES,
				PerfEvent.ENERGY_RAM
			])

			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_CORES_RAM)
			}
		})

		test('only perf event energy-cores available', async () => {
			instance.getOutputContent = jest.fn().mockReturnValue(OUTPUT_CONTENT_CORES)
			instance.isRunning = jest.fn().mockReturnValue(false)
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_CORES
			])
			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_CORES)
			}
		})

		test('only perf event energy-ram available', async () => {
			instance.getOutputContent = jest.fn().mockReturnValue(OUTPUT_CONTENT_RAM)
			instance.isRunning = jest.fn().mockReturnValue(false)
			instance.checkEventAvailability = mock_checkEventAvailability([
				PerfEvent.ENERGY_RAM
			])

			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_RAM)
			}
		})
	})
})