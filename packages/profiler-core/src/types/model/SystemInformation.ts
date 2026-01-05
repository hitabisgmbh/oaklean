export interface ISystemInformation_System {
	manufacturer: string
	model: string
	version: string
	sku: string
	virtual: boolean
	virtualHost?: string
	raspberry?: {
		manufacturer: string;
		processor: string;
		type: string;
		revision: string;
	}
}

export interface ISystemInformation_Chassis {
	manufacturer: string
	model: string
	type: string
	version: string
	assetTag: string
	sku: string
}

export interface ISystemInformation_Baseboard {
	manufacturer: string
	model: string
	version: string
	assetTag: string
	memMax: number | null
	memSlots: number | null
}

export interface ISystemInformation_Cpu {
	manufacturer: string
	brand: string
	vendor: string
	family: string
	model: string
	stepping: string
	revision: string
	voltage: string
	speed: number
	speedMin: number
	speedMax: number
	governor: string
	cores: number
	physicalCores: number
	efficiencyCores?: number
	performanceCores?: number
	processors: number
	socket: string
	flags: string
	virtualization: boolean
	cache: {
		l1d: number
		l1i: number
		l2: number
		l3: number
	}
}

export interface ISystemInformation_Memory {
	total: number
	free: number
	used: number
	active: number
	available: number
	buffcache: number
	buffers: number
	cached: number
	slab: number
	reclaimable: number
	swaptotal: number
	swapused: number
	swapfree: number
	writeback: number | null
	dirty: number | null
}

export interface ISystemInformation_MemoryLayout {
	size: number
	bank: string
	type: string
	ecc?: boolean | null
	clockSpeed: number | null
	formFactor: string
	manufacturer?: string
	partNum: string
	voltageConfigured: number | null
	voltageMin: number | null
	voltageMax: number | null
}

export interface ISystemInformation_Battery {
	hasBattery: boolean
	cycleCount: number
	isCharging: boolean
	voltage: number
	designedCapacity: number
	maxCapacity: number
	currentCapacity: number
	capacityUnit: string
	percent: number
	timeRemaining: number | null
	acConnected: boolean
	type: string
	model: string
	manufacturer: string
	additionalBatteries?: ISystemInformation_Battery[]
}

export interface ISystemInformation_Os {
	platform: string
	distro: string
	release: string
	codename: string
	kernel: string
	arch: string
	codepage: string
	logofile: string
	build: string
	servicepack: string
	uefi: boolean | null
	hypervizor?: boolean
	remoteSession?: boolean
}

export interface ISystemInformation {
	system: ISystemInformation_System
	baseBoard: ISystemInformation_Baseboard
	chassis: ISystemInformation_Chassis
	cpu: ISystemInformation_Cpu
	memory: ISystemInformation_Memory
	memoryLayout: ISystemInformation_MemoryLayout[]
	battery: ISystemInformation_Battery
	os: ISystemInformation_Os
}
