import * as fs from 'fs'

import {
	MicroSeconds_number,
	NanoSeconds_BigInt,
	UnifiedPath
} from '@oaklean/profiler-core'
import { getPlatformSpecificBinaryPath } from '@oaklean/windows-sensorinterface'

import { WindowsSensorInterface } from '../../../src/interfaces/windows/WindowsSensorInterface'

const CURRENT_DIR = new UnifiedPath(__dirname)

const CONTENT_CPU_PACKAGE_GPU_PATH = CURRENT_DIR.join(
	'assets',
	'cpu+gpu.csv'
).toPlatformString()
const CONTENT_CPU_PACKAGE_PATH = CURRENT_DIR.join(
	'assets',
	'cpu.csv'
).toPlatformString()
const CONTENT_GPU_PATH = CURRENT_DIR.join(
	'assets',
	'gpu.csv'
).toPlatformString()

const OUTPUT_CONTENT_CPU_PACKAGE_GPU = fs
	.readFileSync(CONTENT_CPU_PACKAGE_GPU_PATH)
	.toString()

const COLLECTION_CPU_PACKAGE_GPU = JSON.parse(
	fs
		.readFileSync(
			CURRENT_DIR.join('assets', 'cpu+gpu.collection.json').toPlatformString()
		)
		.toString()
)
const COLLECTION_CPU_PACKAGE = JSON.parse(
	fs
		.readFileSync(
			CURRENT_DIR.join('assets', 'cpu.collection.json').toPlatformString()
		)
		.toString()
)
const COLLECTION_GPU = JSON.parse(
	fs
		.readFileSync(
			CURRENT_DIR.join('assets', 'gpu.collection.json').toPlatformString()
		)
		.toString()
)

describe('commandLineArgs', () => {
	test('uses correct executable', async () => {
		const instance = new WindowsSensorInterface(
			{
				outputFilePath: 'out.txt',
				sampleInterval: 100 as MicroSeconds_number
			},
			{
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt,
				offsetTime: 0,
				platform: 'win32'
			}
		)

		expect(instance.executable()).toEqual(
			getPlatformSpecificBinaryPath('win32').toPlatformString()
		)
	})

	test('perf events energy-cores and energy-ram available', async () => {
		const instance = new WindowsSensorInterface(
			{
				outputFilePath: 'out.txt',
				sampleInterval: 100 as MicroSeconds_number
			},
			{
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt,
				offsetTime: 0,
				platform: 'win32'
			}
		)

		expect(await instance.commandLineArgs()).toEqual([
			'samplerate=100',
			'filename=out.txt'
		])
	})

	test('getOutputContent', async () => {
		const instance = new WindowsSensorInterface(
			{
				outputFilePath: CONTENT_CPU_PACKAGE_GPU_PATH,
				sampleInterval: 100 as MicroSeconds_number
			},
			{
				startTime: BigInt(0) as NanoSeconds_BigInt,
				stopTime: BigInt(0) as NanoSeconds_BigInt,
				offsetTime: 0,
				platform: 'win32'
			}
		)

		expect(instance.getOutputContent()).toEqual(OUTPUT_CONTENT_CPU_PACKAGE_GPU)
	})

	describe('readSensorValues', () => {
		test('cpu+gpu', async () => {
			const instance = new WindowsSensorInterface(
				{
					outputFilePath: CONTENT_CPU_PACKAGE_GPU_PATH,
					sampleInterval: 100 as MicroSeconds_number
				},
				{
					startTime: BigInt(0) as NanoSeconds_BigInt,
					stopTime: BigInt(0) as NanoSeconds_BigInt,
					offsetTime: 0,
					platform: 'win32'
				}
			)

			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_CPU_PACKAGE_GPU)
			}
		})

		test('cpu', async () => {
			const instance = new WindowsSensorInterface(
				{
					outputFilePath: CONTENT_CPU_PACKAGE_PATH,
					sampleInterval: 100 as MicroSeconds_number
				},
				{
					startTime: BigInt(0) as NanoSeconds_BigInt,
					stopTime: BigInt(0) as NanoSeconds_BigInt,
					offsetTime: 0,
					platform: 'win32'
				}
			)

			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_CPU_PACKAGE)
			}
		})

		test('gpu', async () => {
			const instance = new WindowsSensorInterface(
				{
					outputFilePath: CONTENT_GPU_PATH,
					sampleInterval: 100 as MicroSeconds_number
				},
				{
					startTime: BigInt(0) as NanoSeconds_BigInt,
					stopTime: BigInt(0) as NanoSeconds_BigInt,
					offsetTime: 0,
					platform: 'win32'
				}
			)

			const result = await instance.readSensorValues(0)
			expect(result).toBeDefined()
			if (result !== undefined) {
				expect(result.toJSON()).toEqual(COLLECTION_GPU)
			}
		})
	})
})
