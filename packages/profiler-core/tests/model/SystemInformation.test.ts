import * as fs from 'fs'

import si from 'systeminformation'

import { UnifiedPath } from '../../src/system/UnifiedPath'
import { SystemInformation } from '../../src/model/SystemInformation'
import { ISystemInformation } from '../../src/types'
import { LoggerHelper } from '../../src'

const CURRENT_DIR = new UnifiedPath(__dirname)

const EXAMPLE_SYSTEM_INFORMATION: ISystemInformation = JSON.parse(
	fs
		.readFileSync(
			CURRENT_DIR.join('assets', 'SystemInformation', 'example.json').toString()
		)
		.toString()
) as ISystemInformation

describe('SystemInformation', () => {
	beforeEach(() => {
		jest.spyOn(si, 'system').mockResolvedValue({
			manufacturer: 'Apple Inc.',
			model: 'Mac14,5',
			version: '',
			uuid: '',
			serial: '',
			sku: '',
			virtual: false
		})

		jest.spyOn(si, 'baseboard').mockResolvedValue({
			manufacturer: 'Apple Inc.',
			model: 'Mac14,5',
			version: '',
			serial: '',
			assetTag: '',
			memMax: 68719476736,
			memSlots: 0
		})

		jest.spyOn(si, 'chassis').mockResolvedValue({
			manufacturer: 'Apple Inc.',
			model: 'Mac14,5',
			type: '',
			version: '',
			serial: '',
			assetTag: '',
			sku: ''
		})

		jest.spyOn(si, 'cpu').mockResolvedValue({
			manufacturer: 'Apple',
			brand: 'M2 Max',
			vendor: 'Apple',
			family: '-634136515',
			model: '',
			stepping: '5',
			revision: '',
			voltage: '',
			speed: 2.4,
			speedMin: 2.4,
			speedMax: 2.4,
			governor: '',
			cores: 12,
			physicalCores: 12,
			efficiencyCores: 4,
			performanceCores: 8,
			processors: 1,
			socket: 'SOC',
			flags: '',
			virtualization: true,
			cache: {
				l1d: 131072,
				l1i: 65536,
				l2: 4194304,
				l3: 0
			}
		})

		jest.spyOn(si, 'mem').mockResolvedValue({
			total: 68719476736,
			free: 7562002432,
			used: 61157474304,
			active: 26543980544,
			available: 42175496192,
			buffcache: 34613493760,
			buffers: 0,
			cached: 0,
			slab: 0,
			reclaimable: 29025796096,
			swaptotal: 3221225472,
			swapused: 1477244354.56,
			swapfree: 1743981117.44,
			writeback: null,
			dirty: null
		})

		jest.spyOn(si, 'memLayout').mockResolvedValue([
			{
				size: 68719476736,
				bank: '0',
				type: 'LPDDR5',
				ecc: false,
				clockSpeed: 0,
				formFactor: '',
				manufacturer: 'Apple',
				partNum: '',
				serialNum: '',
				voltageConfigured: null,
				voltageMin: null,
				voltageMax: null
			}
		])

		jest.spyOn(si, 'battery').mockResolvedValue({
			hasBattery: true,
			cycleCount: 215,
			isCharging: true,
			voltage: 12.517,
			designedCapacity: 76041,
			maxCapacity: 63449,
			currentCapacity: 46688,
			capacityUnit: 'mWh',
			percent: 75,
			timeRemaining: 0,
			acConnected: true,
			type: 'Li-ion',
			model: '',
			manufacturer: 'Apple',
			serial: ''
		})

		jest.spyOn(si, 'osInfo').mockResolvedValue({
			platform: 'darwin',
			distro: 'macOS',
			release: '14.1.2',
			codename: 'macOS Sonoma',
			kernel: '23.1.0',
			arch: 'arm64',
			hostname: '',
			fqdn: '',
			codepage: 'UTF-8',
			logofile: 'darwin',
			serial: '',
			build: '23B92',
			servicepack: '',
			uefi: true
		})
	})
	afterEach(() => {
		jest.resetAllMocks()
	})

	test('collect', async () => {
		expect((await SystemInformation.collect()).toJSON()).toEqual(
			EXAMPLE_SYSTEM_INFORMATION
		)
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const reportFromString = SystemInformation.fromJSON(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			)
			expect(reportFromString.toJSON()).toEqual(EXAMPLE_SYSTEM_INFORMATION)
		})

		test('deserialization from object', () => {
			const reportFromObject = SystemInformation.fromJSON(
				EXAMPLE_SYSTEM_INFORMATION
			)
			expect(reportFromObject.toJSON()).toEqual(EXAMPLE_SYSTEM_INFORMATION)
		})
	})

	describe('sameSystem', () => {
		let consoleError: jest.SpyInstance

		beforeEach(() => {
			consoleError = jest.spyOn(LoggerHelper, 'error')
			consoleError.mockImplementation(() => undefined)
		})

		afterEach(() => {
			consoleError.mockRestore()
		})
		test('empty input', () => {
			const t = () => {
				SystemInformation.sameSystem()
			}

			expect(t).toThrow(
				'SystemInformation.merge: no SystemInformation were given'
			)
		})

		test('equal total', () => {
			expect(
				SystemInformation.sameSystem(
					EXAMPLE_SYSTEM_INFORMATION,
					EXAMPLE_SYSTEM_INFORMATION
				)
			).toBe(true)

			expect(consoleError).toHaveBeenCalledTimes(0)
		})
		test('different system', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.system.manufacturer = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different systems'
			)
		})

		test('different baseboard', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.baseBoard.manufacturer = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different baseboards'
			)
		})

		test('different chassis', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.chassis.manufacturer = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different chassis'
			)
		})

		test('different cpu', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.cpu.manufacturer = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different cpus'
			)
		})

		test('different memory', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.memory.total -= 1

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different memory'
			)
		})

		test('different memoryLayout', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.memoryLayout.push(DIFF.memoryLayout[0])

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different memoryLayout'
			)
		})

		test('different battery', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.battery.manufacturer = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different battery'
			)
		})

		test('different os', () => {
			const DIFF = JSON.parse(
				JSON.stringify(EXAMPLE_SYSTEM_INFORMATION)
			) as ISystemInformation
			DIFF.os.platform = 'abc'

			expect(
				SystemInformation.sameSystem(EXAMPLE_SYSTEM_INFORMATION, DIFF)
			).toBe(false)

			expect(consoleError).toHaveBeenCalledWith(
				'SystemInformation.isSame: detected different os'
			)
		})
	})
})
