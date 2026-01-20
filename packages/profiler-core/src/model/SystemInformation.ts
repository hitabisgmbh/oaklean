import si, { Systeminformation } from 'systeminformation'

import { BaseModel } from './BaseModel'

// Types
import {
	ISystemInformation_System,
	ISystemInformation_Baseboard,
	ISystemInformation_Chassis,
	ISystemInformation_Cpu,
	ISystemInformation_Memory,
	ISystemInformation_MemoryLayout,
	ISystemInformation_Battery,
	ISystemInformation_Os,
	ISystemInformation
} from '../types'
import { LoggerHelper } from '../helper/LoggerHelper'

export class SystemInformation extends BaseModel {
	system: ISystemInformation_System
	baseBoard: ISystemInformation_Baseboard
	chassis: ISystemInformation_Chassis
	cpu: ISystemInformation_Cpu
	memory: ISystemInformation_Memory
	memoryLayout: ISystemInformation_MemoryLayout[]
	battery: ISystemInformation_Battery
	os: ISystemInformation_Os

	constructor(
		system: ISystemInformation_System,
		baseBoard: ISystemInformation_Baseboard,
		chassis: ISystemInformation_Chassis,
		cpu: ISystemInformation_Cpu,
		memory: ISystemInformation_Memory,
		memoryLayout: ISystemInformation_MemoryLayout[],
		battery: ISystemInformation_Battery,
		os: ISystemInformation_Os
	) {
		super()
		this.system = system
		this.baseBoard = baseBoard
		this.chassis = chassis
		this.cpu = cpu
		this.memory = memory
		this.memoryLayout = memoryLayout
		this.battery = battery
		this.os = os
	}

	static sameSystem(...args: ISystemInformation[]): boolean {
		if (args.length === 0) {
			throw new Error('SystemInformation.merge: no SystemInformation were given')
		}
		const firstSystemInformation = args[0]
		const firstSystem = firstSystemInformation.system
		const firstBaseBoard = firstSystemInformation.baseBoard
		const firstChassi = firstSystemInformation.chassis
		const firstCpu = firstSystemInformation.cpu
		const firstMemory = firstSystemInformation.memory
		const firstMemoryLayout = firstSystemInformation.memoryLayout
		const firstBattery = firstSystemInformation.battery
		const firstOs = firstSystemInformation.os

		for (const currentSystemInformation of args) {
			const currentSystem = currentSystemInformation.system

			const systemIsTheSame =
				firstSystem.manufacturer === currentSystem.manufacturer &&
				firstSystem.model === currentSystem.model &&
				firstSystem.version === currentSystem.version &&
				firstSystem.virtual === currentSystem.virtual

			if (!systemIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different systems')
				return false
			}

			const currentBaseBoard = currentSystemInformation.baseBoard

			const baseBoardIsTheSame =
				firstBaseBoard.manufacturer === currentBaseBoard.manufacturer &&
				firstBaseBoard.model === currentBaseBoard.model &&
				firstBaseBoard.version === currentBaseBoard.version &&
				firstBaseBoard.memMax === currentBaseBoard.memMax &&
				firstBaseBoard.memSlots === currentBaseBoard.memSlots
			if (!baseBoardIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different baseboards')
				return false
			}

			const currentChassis = currentSystemInformation.chassis

			const chassisIsTheSame =
				firstChassi.manufacturer === currentChassis.manufacturer &&
				firstChassi.model === currentChassis.model &&
				firstChassi.type === currentChassis.type &&
				firstChassi.version === currentChassis.version &&
				firstChassi.assetTag === currentChassis.assetTag &&
				firstChassi.sku === currentChassis.sku
			if (!chassisIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different chassis')
				return false
			}

			const currentCpu = currentSystemInformation.cpu

			const cpuIsTheSame =
				firstCpu.manufacturer === currentCpu.manufacturer &&
				firstCpu.brand === currentCpu.brand &&
				firstCpu.vendor === currentCpu.vendor &&
				firstCpu.family === currentCpu.family &&
				firstCpu.model === currentCpu.model &&
				firstCpu.stepping === currentCpu.stepping &&
				firstCpu.revision === currentCpu.revision &&
				firstCpu.speedMin === currentCpu.speedMin &&
				firstCpu.speedMax === currentCpu.speedMax &&
				firstCpu.cores === currentCpu.cores &&
				firstCpu.physicalCores === currentCpu.physicalCores &&
				firstCpu.efficiencyCores === currentCpu.efficiencyCores &&
				firstCpu.performanceCores === currentCpu.performanceCores &&
				firstCpu.processors === currentCpu.processors &&
				firstCpu.virtualization === currentCpu.virtualization &&
				firstCpu.cache.l1d === currentCpu.cache.l1d &&
				firstCpu.cache.l1i === currentCpu.cache.l1i &&
				firstCpu.cache.l2 === currentCpu.cache.l2 &&
				firstCpu.cache.l3 === currentCpu.cache.l3
			if (!cpuIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different cpus')
				return false
			}

			const currentMemory = currentSystemInformation.memory

			const memoryIsTheSame = firstMemory.total === currentMemory.total
			if (!memoryIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different memory')
				return false
			}

			const currentMemoryLayout = currentSystemInformation.memoryLayout

			if (firstMemoryLayout.length !== currentMemoryLayout.length) {
				LoggerHelper.error('SystemInformation.isSame: detected different memoryLayout')
				return false
			}

			for (let i = 0; i < firstMemoryLayout.length; i++) {
				const memoryLayoutIsTheSame =
					firstMemoryLayout[i].size === currentMemoryLayout[i].size &&
					firstMemoryLayout[i].type === currentMemoryLayout[i].type &&
					firstMemoryLayout[i].manufacturer === currentMemoryLayout[i].manufacturer &&
					firstMemoryLayout[i].voltageMin === currentMemoryLayout[i].voltageMin &&
					firstMemoryLayout[i].voltageMax === currentMemoryLayout[i].voltageMax

				if (!memoryLayoutIsTheSame) {
					LoggerHelper.error('SystemInformation.isSame: detected different memoryLayout')
					return false
				}
			}

			const currentBattery = currentSystemInformation.battery

			const batteryIsTheSame =
				firstBattery.type === currentBattery.type &&
				firstBattery.model === currentBattery.model &&
				firstBattery.manufacturer === currentBattery.manufacturer
			if (!batteryIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different battery')
				return false
			}

			const currentOs = currentSystemInformation.os

			const osIsTheSame =
				firstOs.platform === currentOs.platform &&
				firstOs.distro === currentOs.distro &&
				firstOs.release === currentOs.release &&
				firstOs.codename === currentOs.codename &&
				firstOs.kernel === currentOs.kernel &&
				firstOs.arch === currentOs.arch &&
				firstOs.codepage === currentOs.codepage &&
				firstOs.logofile === currentOs.logofile &&
				firstOs.build === currentOs.build &&
				firstOs.servicepack === currentOs.servicepack &&
				firstOs.uefi === currentOs.uefi

			if (!osIsTheSame) {
				LoggerHelper.error('SystemInformation.isSame: detected different os')
				return false
			}
		}

		return true
	}

	static async collect(): Promise<SystemInformation> {
		return new SystemInformation(
			await this.systemInfo(),
			await this.baseBoardInfo(),
			await this.chassisInfo(),
			await this.cpuInfo(),
			await this.memoryInfo(),
			await this.memoryLayoutInfo(),
			await this.batteryInfo(),
			await this.osInfo()
		)
	}

	static async systemInfo(): Promise<ISystemInformation_System> {
		const { manufacturer, model, version, sku, virtual, virtualHost, raspberry } = await si.system()

		let raspberryInfo = undefined
		if (raspberry) {
			raspberryInfo = {
				manufacturer: raspberry.manufacturer,
				processor: raspberry.processor,
				type: raspberry.type,
				revision: raspberry.revision
			}
		}

		return {
			manufacturer,
			model,
			version,
			sku,
			virtual,
			virtualHost,
			raspberry: raspberryInfo
		}
	}

	static async baseBoardInfo(): Promise<ISystemInformation_Baseboard> {
		const { manufacturer, model, version, assetTag, memMax, memSlots } = await si.baseboard()

		return {
			manufacturer,
			model,
			version,
			assetTag,
			memMax,
			memSlots
		}
	}

	static async chassisInfo(): Promise<ISystemInformation_Chassis> {
		const { manufacturer, model, type, version, assetTag, sku } = await si.chassis()

		return {
			manufacturer,
			model,
			type,
			version,
			assetTag,
			sku
		}
	}

	static async cpuInfo(): Promise<ISystemInformation_Cpu> {
		const {
			manufacturer,
			brand,
			vendor,
			family,
			model,
			stepping,
			revision,
			voltage,
			speed,
			speedMin,
			speedMax,
			governor,
			cores,
			physicalCores,
			efficiencyCores,
			performanceCores,
			processors,
			socket,
			flags,
			virtualization,
			cache: { l1d, l1i, l2, l3 }
		} = await si.cpu()

		return {
			manufacturer,
			brand,
			vendor,
			family,
			model,
			stepping,
			revision,
			voltage,
			speed,
			speedMin,
			speedMax,
			governor,
			cores,
			physicalCores,
			efficiencyCores,
			performanceCores,
			processors,
			socket,
			flags,
			virtualization,
			cache: {
				l1d,
				l1i,
				l2,
				l3
			}
		}
	}

	static async memoryInfo(): Promise<ISystemInformation_Memory> {
		const {
			total,
			free,
			used,
			active,
			available,
			buffcache,
			buffers,
			cached,
			slab,
			reclaimable,
			swaptotal,
			swapused,
			swapfree,
			writeback,
			dirty
		} = await si.mem()

		return {
			total,
			free,
			used,
			active,
			available,
			buffcache,
			buffers,
			cached,
			slab,
			reclaimable,
			swaptotal,
			swapused,
			swapfree,
			writeback,
			dirty
		}
	}

	static async memoryLayoutInfo(): Promise<ISystemInformation_MemoryLayout[]> {
		return (await si.memLayout()).map(
			({
				size,
				bank,
				type,
				ecc,
				clockSpeed,
				formFactor,
				manufacturer,
				partNum,
				voltageConfigured,
				voltageMin,
				voltageMax
			}) => {
				return {
					size,
					bank,
					type,
					ecc,
					clockSpeed,
					formFactor,
					manufacturer,
					partNum,
					voltageConfigured,
					voltageMin,
					voltageMax
				}
			}
		)
	}

	static async batteryInfo(): Promise<ISystemInformation_Battery> {
		function convert(data: Systeminformation.BatteryData): ISystemInformation_Battery {
			const {
				hasBattery,
				cycleCount,
				isCharging,
				voltage,
				designedCapacity,
				maxCapacity,
				currentCapacity,
				capacityUnit,
				percent,
				timeRemaining,
				acConnected,
				type,
				model,
				manufacturer,
				additionalBatteries
			} = data

			return {
				hasBattery,
				cycleCount,
				isCharging,
				voltage,
				designedCapacity,
				maxCapacity,
				currentCapacity,
				capacityUnit,
				percent,
				timeRemaining,
				acConnected,
				type,
				model,
				manufacturer,
				additionalBatteries: additionalBatteries?.map((x) => convert(x))
			}
		}

		return convert(await si.battery())
	}

	static async osInfo(): Promise<ISystemInformation_Os> {
		const {
			platform,
			distro,
			release,
			codename,
			kernel,
			arch,
			codepage,
			logofile,
			build,
			servicepack,
			uefi,
			hypervizor,
			remoteSession
		} = await si.osInfo()

		return {
			platform,
			distro,
			release,
			codename,
			kernel,
			arch,
			codepage,
			logofile,
			build,
			servicepack,
			uefi,
			hypervizor,
			remoteSession
		}
	}

	toJSON(): ISystemInformation {
		return {
			system: this.system,
			baseBoard: this.baseBoard,
			chassis: this.chassis,
			cpu: this.cpu,
			memory: this.memory,
			memoryLayout: this.memoryLayout,
			battery: this.battery,
			os: this.os
		}
	}

	static fromJSON(json: string | ISystemInformation): SystemInformation {
		let data: ISystemInformation
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		return new SystemInformation(
			data.system,
			data.baseBoard,
			data.chassis,
			data.cpu,
			data.memory,
			data.memoryLayout,
			data.battery,
			data.os
		)
	}
}
