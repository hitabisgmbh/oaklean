import * as fs from 'fs'

import { BaseModel } from './BaseModel'

import {
	STATIC_CONFIG_FILENAME,
	DEFAULT_PROFILER_CONFIG
} from '../constants/config'
import { PathUtils } from '../helper/PathUtils'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto } from '../system/Crypto'
import { PermissionHelper } from '../helper/PermissionHelper'
// Types
import {
	IPowerMetricsSensorInterfaceOptions,
	IPerfSensorInterfaceOptions,
	IWindowsSensorInterfaceOptions,
	ProjectIdentifier_string,
	MicroSeconds_number,
	IProfilerConfig,
	RegistryOptions,
	ExportOptions,
	ProjectOptions,
	RuntimeOptions,
	SensorInterfaceType
} from '../types'

export class ProfilerConfig extends BaseModel implements IProfilerConfig {
	filePath: UnifiedPath
	extends?: string
	registryOptions: RegistryOptions
	exportOptions: ExportOptions
	projectOptions: ProjectOptions
	runtimeOptions: RuntimeOptions

	constructor(filePath: UnifiedPath, config: IProfilerConfig) {
		super()
		this.filePath = filePath
		this.extends = config.extends
		this.registryOptions = config.registryOptions
		this.exportOptions = config.exportOptions
		this.projectOptions = config.projectOptions
		this.runtimeOptions = config.runtimeOptions
	}

	static getDefaultConfig() {
		return new ProfilerConfig(
			new UnifiedPath(process.cwd()).join(STATIC_CONFIG_FILENAME),
			DEFAULT_PROFILER_CONFIG
		)
	}

	getAnonymizedRuntimeOptions(): RuntimeOptions {
		if (this.runtimeOptions.sensorInterface) {
			switch (this.runtimeOptions.sensorInterface.type) {
				case SensorInterfaceType.windows:
					return {
						...this.runtimeOptions,
						sensorInterface: {
							type: SensorInterfaceType.windows,
							options: {
								sampleInterval: this.runtimeOptions.sensorInterface.options.sampleInterval,
								outputFilePath: '<anonymized>'
							}
						}
					}
				case SensorInterfaceType.perf:
					return {
						...this.runtimeOptions,
						sensorInterface: {
							type: SensorInterfaceType.perf,
							options: {
								sampleInterval: this.runtimeOptions.sensorInterface.options.sampleInterval,
								outputFilePath: '<anonymized>'
							}
						}
					}
				case SensorInterfaceType.powermetrics:
					return {
						...this.runtimeOptions,
						sensorInterface: {
							type: SensorInterfaceType.powermetrics,
							options: {
								sampleInterval: this.runtimeOptions.sensorInterface.options.sampleInterval,
								outputFilePath: '<anonymized>'
							}
						}
					}
			}
		}
		return this.runtimeOptions
	}

	getV8CPUSamplingInterval(): MicroSeconds_number {
		return this.runtimeOptions.v8.cpu.sampleInterval
	}

	getRegistryUploadUrl(): string {
		return `http://${this.registryOptions.url}/upload`
	}

	uploadEnabled(): boolean {
		return (this.registryOptions?.url !== undefined) && this.registryOptions?.url !== ''
	}

	getProjectIdentifier(): ProjectIdentifier_string {
		if (!Crypto.validateUniqueID(this.projectOptions.identifier)) {
			throw new Error('ProfilerConfig.getProjectIdentifier: identifier should be an uuid4')
		}
		return this.projectOptions.identifier
	}

	getRootDir() : UnifiedPath {
		if (PathUtils.isAbsolute(this.exportOptions.rootDir)) {
			return new UnifiedPath(this.exportOptions.rootDir)
		}
		return this.filePath.dirName().join(this.exportOptions.rootDir)
	}

	getOutDir() : UnifiedPath {
		if (PathUtils.isAbsolute(this.exportOptions.outDir)) {
			return new UnifiedPath(this.exportOptions.outDir)
		}
		return this.filePath.dirName().join(this.exportOptions.outDir)
	}

	getOutHistoryDir(): UnifiedPath {
		if (PathUtils.isAbsolute(this.exportOptions.outHistoryDir)) {
			return new UnifiedPath(this.exportOptions.outHistoryDir)
		}
		return this.filePath.dirName().join(this.exportOptions.outHistoryDir)
	}

	getSensorInterfaceType(): SensorInterfaceType | undefined {
		return this.runtimeOptions.sensorInterface?.type
	}

	getSensorInterfaceOptions():
	IPowerMetricsSensorInterfaceOptions |
	IPerfSensorInterfaceOptions |
	IWindowsSensorInterfaceOptions |
	undefined {
		return this.runtimeOptions.sensorInterface?.options
	}

	shouldExportV8Profile(): boolean {
		return this.exportOptions.exportV8Profile
	}

	shouldExportReport(): boolean {
		return this.exportOptions.exportReport
	}

	shouldExportSensorInterfaceData(): boolean {
		return this.exportOptions.exportSensorInterfaceData
	}

	getSeedForMathRandom(): string | undefined {
		return this.runtimeOptions.seeds['Math.random']
	}

	private configAsExtended(pathDiff: UnifiedPath): IProfilerConfig {
		const exportOptions = this.exportOptions
		if (exportOptions) {
			if (exportOptions.outDir && !PathUtils.isAbsolute(exportOptions.outDir)) {
				exportOptions.outDir = pathDiff.join(exportOptions.outDir).toString()
			}
			if (exportOptions.outHistoryDir && !PathUtils.isAbsolute(exportOptions.outHistoryDir)) {
				exportOptions.outHistoryDir = pathDiff.join(exportOptions.outHistoryDir).toString()
			}
			if (exportOptions.rootDir && !PathUtils.isAbsolute(exportOptions.rootDir)) {
				exportOptions.rootDir = pathDiff.join(exportOptions.rootDir).toString()
			}
		}
		return {
			exportOptions: exportOptions,
			projectOptions: this.projectOptions,
			runtimeOptions: this.runtimeOptions,
			registryOptions: this.registryOptions
		}
	}

	/**
	 * Fills unspecified values of the config with values of the given config
	 * 
	 * example usage:
	 * - every config that gets resolved inherits values of the default config (baseConfig)
	 * 		to ensure that unspecified values are filled with the default value. This happens via:
	 * 		config.implement(baseConfig):
	 * 
	 * - if a config contains the extends keyword like this:
	 * 		{
	 * 	 		"extends": "<config that gets extended>"
	 * 		}
	 * 		the config gets extended via:
	 * 		config.implement(<config that gets extended>):
	 * 
	 * it also adjusts the inherited path values values to make them relative to the config
	 * 
	 * 
	 * @param config to inherit from
	 */
	private implement(config: ProfilerConfig) {
		const pathDiff = this.filePath.dirName().pathTo(config.filePath.dirName())
		const configToExtend = config.configAsExtended(pathDiff)

		const newExportOptions = { ...configToExtend.exportOptions, ...this.exportOptions }
		const newProjectOptions = { ...configToExtend.projectOptions, ...this.projectOptions }
		const newRuntimeOptions: RuntimeOptions = {
			...configToExtend.runtimeOptions,
			...this.runtimeOptions,
			seeds: {
				...(configToExtend?.runtimeOptions?.seeds || {}),
				...(this.runtimeOptions?.seeds || {})
			},
			v8: {
				cpu: {
					...(configToExtend.runtimeOptions?.v8?.cpu || {}),
					...(this.runtimeOptions?.v8?.cpu || {}),
				}
			},
		}
		const newRegistryOptions = { ...configToExtend.registryOptions, ...this.registryOptions }

		this.exportOptions = newExportOptions
		this.projectOptions = newProjectOptions
		this.runtimeOptions = newRuntimeOptions
		this.registryOptions = newRegistryOptions
	}

	static fromJSON(json: string | IProfilerConfig): ProfilerConfig {
		let data: IProfilerConfig
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		if (
			data.projectOptions === undefined ||
			data.projectOptions.identifier === undefined
		) {
			throw new Error('ProfilerConfig: the project has no identifier yet')
		}
		if (!Crypto.validateUniqueID(data.projectOptions.identifier)) {
			throw new Error('ProfilerConfig.getProjectIdentifier: Loaded identifier from the config should be an uuid4')
		}

		return new ProfilerConfig(
			new UnifiedPath(''),
			{
				extends: data.extends,
				exportOptions: data.exportOptions,
				projectOptions: data.projectOptions,
				runtimeOptions: data.runtimeOptions,
				registryOptions: data.registryOptions
			})
	}

	toJSON(): IProfilerConfig {
		return ({
			extends: this.extends,
			exportOptions: this.exportOptions,
			projectOptions: this.projectOptions,
			runtimeOptions: this.runtimeOptions,
			registryOptions: this.registryOptions
		})
	}

	storeToFile(filePath: UnifiedPath) {
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(filePath.dirName().toPlatformString())
		}
		PermissionHelper.writeFileWithUserPermission(
			filePath.toPlatformString(),
			JSON.stringify(this, null, 2)
		)
	}

	// loads a config from a given file path and extends it
	// this method is NOT used to ensure load a valid (complete) config, use resolveFromFile to achieve that
	static loadFromFile(filePath: UnifiedPath): ProfilerConfig | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}

		const loadedConfig = ProfilerConfig.fromJSON(fs.readFileSync(filePath.toPlatformString()).toString())
		loadedConfig.filePath = filePath

		if (loadedConfig.extends) {
			const configToExtendFilePath = filePath.dirName().join(loadedConfig.extends)
			const configToExtend = ProfilerConfig.loadFromFile(configToExtendFilePath)

			if (configToExtend) {
				loadedConfig.implement(configToExtend)
				return loadedConfig
			}
		}
		return loadedConfig
	}

	// loads a config from a given file path and fills all non defined values with the resp. default values
	static resolveFromFile(filePath: UnifiedPath | undefined): ProfilerConfig {
		const baseConfig = ProfilerConfig.getDefaultConfig()
		if (!filePath) {
			return baseConfig
		}

		const config = this.loadFromFile(filePath)
		if (config) {
			baseConfig.filePath = config.filePath
			config.implement(baseConfig)
			return config
		}
		return baseConfig
	}

	static autoResolveFromPath(startDir: UnifiedPath) : ProfilerConfig {
		// Searches from the given path upwards until it finds the config file
		const configFilePath = PathUtils.findUp(
			STATIC_CONFIG_FILENAME,
			startDir.toPlatformString()
		)

		if (!configFilePath) {
			return ProfilerConfig.resolveFromFile(undefined)
		}

		return ProfilerConfig.resolveFromFile(new UnifiedPath(configFilePath))
	}

	static autoResolve() : ProfilerConfig {
		// Searches from the processes execution path upwards until it finds the config file
		return this.autoResolveFromPath(new UnifiedPath(process.cwd()))
	}
}