import * as fs from 'fs'

import * as jsoncParser from 'jsonc-parser'
import { z as zod } from 'zod'

import {
	STATIC_CONFIG_FILENAME,
	DEFAULT_PROFILER_CONFIG
} from '../constants/config'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto } from '../system/Crypto'
import { PermissionHelper } from '../helper/PermissionHelper'
import { LoggerHelper } from '../helper/LoggerHelper'
import { PathUtils } from '../helper/PathUtils'
// Types
import {
	IPowerMetricsSensorInterfaceOptions,
	IPerfSensorInterfaceOptions,
	IWindowsSensorInterfaceOptions,
	ProjectIdentifier_string,
	MicroSeconds_number,
	IProfilerConfig,
	IProfilerConfigFileRepresentation,
	RegistryOptions,
	ExportOptions,
	ProjectOptions,
	RuntimeOptions,
	SensorInterfaceType,
	DeepPartial,
	IProfilerConfig_schema
} from '../types'
import { JsoncHelper } from '../helper/JsoncHelper'
import { ProfilerConfigCommentHelper } from '../helper/ProfilerConfigCommentHelper'

export interface IProfilerConfigIntermediate extends IProfilerConfigFileRepresentation {
	filePath: UnifiedPath
}

export class ProfilerConfig implements IProfilerConfig {
	filePath: UnifiedPath
	extends?: string
	registryOptions: RegistryOptions
	exportOptions: ExportOptions
	projectOptions: ProjectOptions
	runtimeOptions: RuntimeOptions

	constructor(filePath: UnifiedPath, config: IProfilerConfig) {
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

	static defaultConfigAsIntermediate() {
		return {
			filePath: new UnifiedPath(process.cwd()).join(STATIC_CONFIG_FILENAME),
			...DEFAULT_PROFILER_CONFIG
		}
	}

	static verifyConfig(
		config: DeepPartial<IProfilerConfig> | undefined
	): config is IProfilerConfig {
		IProfilerConfig_schema.parse(config)
		return true
	}

	static printZodError(err: zod.ZodError) {
		LoggerHelper.error('ProfilerConfig.verifyConfig: Invalid config')
		for (const issue of err.issues) {
			LoggerHelper.error(`${issue.path.join('.')} - ${issue.message}`)
		}
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
								sampleInterval:
									this.runtimeOptions.sensorInterface.options.sampleInterval,
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
								sampleInterval:
									this.runtimeOptions.sensorInterface.options.sampleInterval,
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
								sampleInterval:
									this.runtimeOptions.sensorInterface.options.sampleInterval,
								outputFilePath: '<anonymized>'
							}
						}
					}
			}
		}
		return this.runtimeOptions
	}

	getV8CPUSamplingInterval(): MicroSeconds_number {
		return this.runtimeOptions.v8.cpu.sampleInterval as MicroSeconds_number
	}

	getRegistryUploadUrl(): string {
		return `http://${this.registryOptions.url}/upload`
	}

	uploadEnabled(): boolean {
		return (
			this.registryOptions?.url !== undefined &&
			this.registryOptions?.url !== ''
		)
	}

	getProjectIdentifier(): ProjectIdentifier_string {
		if (
			!Crypto.validateUniqueID(
				this.projectOptions.identifier as ProjectIdentifier_string
			)
		) {
			throw new Error(
				'ProfilerConfig.getProjectIdentifier: identifier should be an uuid4'
			)
		}
		return this.projectOptions.identifier as ProjectIdentifier_string
	}

	getRootDir(): UnifiedPath {
		if (PathUtils.isAbsolute(this.exportOptions.rootDir)) {
			return new UnifiedPath(this.exportOptions.rootDir)
		}
		return this.filePath.dirName().join(this.exportOptions.rootDir)
	}

	getOutDir(): UnifiedPath {
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

	static getSensorInterfaceType(
		json: IProfilerConfigFileRepresentation
	): SensorInterfaceType | undefined {
		return json.runtimeOptions?.sensorInterface?.type
	}

	getSensorInterfaceOptions():
		| IPowerMetricsSensorInterfaceOptions
		| IPerfSensorInterfaceOptions
		| IWindowsSensorInterfaceOptions
		| undefined {
		return this.runtimeOptions.sensorInterface?.options as
			| IPowerMetricsSensorInterfaceOptions
			| IPerfSensorInterfaceOptions
			| IWindowsSensorInterfaceOptions
			| undefined
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

	static configAsExtended(
		config: IProfilerConfigIntermediate,
		pathDiff: UnifiedPath
	): IProfilerConfigFileRepresentation {
		const exportOptions = config.exportOptions
		if (exportOptions) {
			if (exportOptions.outDir && !PathUtils.isAbsolute(exportOptions.outDir)) {
				exportOptions.outDir = pathDiff.join(exportOptions.outDir).toString()
			}
			if (
				exportOptions.outHistoryDir &&
				!PathUtils.isAbsolute(exportOptions.outHistoryDir)
			) {
				exportOptions.outHistoryDir = pathDiff
					.join(exportOptions.outHistoryDir)
					.toString()
			}
			if (
				exportOptions.rootDir &&
				!PathUtils.isAbsolute(exportOptions.rootDir)
			) {
				exportOptions.rootDir = pathDiff.join(exportOptions.rootDir).toString()
			}
		}
		return {
			exportOptions: exportOptions,
			projectOptions: config.projectOptions,
			runtimeOptions: config.runtimeOptions,
			registryOptions: config.registryOptions
		}
	}

	/**
	 * Fills unspecified values of the config with values of the given config to extend from
	 *
	 * example usage:
	 * - every config that gets resolved inherits values of the default config (baseConfig)
	 * 		to ensure that unspecified values are filled with the default value. This happens via:
	 * 		ProfilerConfig.implement(config, baseConfig):
	 *
	 * - if a config contains the extends keyword like this:
	 * 		{
	 * 	 		"extends": "<config that gets extended>"
	 * 		}
	 * 		the config gets extended via:
	 * 		ProfilerConfig.implement(config, <config mentioned in extends>):
	 *
	 * it also adjusts the inherited path values values to make them relative to the config
	 *
	 *
	 * @param config to inherit from
	 */
	static implement(
		config: IProfilerConfigIntermediate,
		configToExtend: IProfilerConfigIntermediate
	) {
		const pathDiff = config.filePath
			.dirName()
			.pathTo(configToExtend.filePath.dirName())
		const configToExtendAsExtended = ProfilerConfig.configAsExtended(
			configToExtend,
			pathDiff
		)

		const newExportOptions = {
			...configToExtendAsExtended.exportOptions,
			...config.exportOptions
		}
		const newProjectOptions = {
			...configToExtendAsExtended.projectOptions,
			...config.projectOptions
		}
		const newRuntimeOptions: DeepPartial<RuntimeOptions> = {
			...configToExtendAsExtended.runtimeOptions,
			...config.runtimeOptions,
			seeds: {
				...(configToExtendAsExtended?.runtimeOptions?.seeds || {}),
				...(config.runtimeOptions?.seeds || {})
			},
			v8: {
				cpu: {
					...(configToExtendAsExtended.runtimeOptions?.v8?.cpu || {}),
					...(config.runtimeOptions?.v8?.cpu || {})
				}
			}
		}
		const newRegistryOptions = {
			...configToExtendAsExtended.registryOptions,
			...config.registryOptions
		}

		config.exportOptions = newExportOptions
		config.projectOptions = newProjectOptions
		config.runtimeOptions = newRuntimeOptions
		config.registryOptions = newRegistryOptions
	}

	static intermediateFromJSON(
		json: string | IProfilerConfigFileRepresentation
	): IProfilerConfigIntermediate {
		let data: IProfilerConfigIntermediate
		if (typeof json === 'string') {
			data = JSON.parse(json)
			data.filePath = new UnifiedPath('')
		} else {
			data = {
				...json,
				filePath: new UnifiedPath('')
			}
		}

		return data
	}

	toJSON(): IProfilerConfig {
		return {
			extends: this.extends,
			exportOptions: this.exportOptions,
			projectOptions: this.projectOptions,
			runtimeOptions: this.runtimeOptions,
			registryOptions: this.registryOptions
		}
	}

	storeToFile(
		filePath: UnifiedPath,
		options?: {
			addDefaultComments?: boolean
		}
	) {
		let content = ''
		if (fs.existsSync(filePath.toPlatformString())) {
			content = fs.readFileSync(filePath.toPlatformString(), 'utf8')
		} else {
			// Create new file with empty JSON object
			content = '{}'
		}
		const jsonc = new JsoncHelper(content)
		jsonc.updateJsoncContent(this.toJSON())
		let output = jsonc.toString()
		if (options?.addDefaultComments) {
			output =
				ProfilerConfigCommentHelper.addDefaultCommentsToConfigFileContent(
					output
				)
		}

		PermissionHelper.writeFileWithUserPermission(filePath, output)
	}

	static storeIntermediateToFile(
		filePath: UnifiedPath,
		config: IProfilerConfigFileRepresentation,
		options?: {
			addDefaultComments?: boolean
		}
	) {
		let content = ''
		if (fs.existsSync(filePath.toPlatformString())) {
			content = fs.readFileSync(filePath.toPlatformString(), 'utf8')
		} else {
			// Create new file with empty JSON object
			content = '{}'
		}
		const jsonc = new JsoncHelper(content)
		jsonc.updateJsoncContent(config)
		let output = jsonc.toString()
		if (options?.addDefaultComments) {
			output =
				ProfilerConfigCommentHelper.addDefaultCommentsToConfigFileContent(
					output
				)
		}
		PermissionHelper.writeFileWithUserPermission(filePath, output)
	}

	// loads a config from a given file path and extends it
	// this method is NOT used to ensure load a valid (complete) config, use resolveFromFile to achieve that
	static loadFromFile(
		filePath: UnifiedPath
	): IProfilerConfigIntermediate | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}

		const content = fs.readFileSync(filePath.toPlatformString()).toString()
		const errors: jsoncParser.ParseError[] = []
		const configJSON = jsoncParser.parse(content, errors, {
			allowTrailingComma: true,
			allowEmptyContent: true
		})

		if (errors.length > 0) {
			const errorMessages = errors
				.map(
					(err) =>
						`Line ${err.offset}: ${jsoncParser.printParseErrorCode(err.error)}`
				)
				.join(', ')
			LoggerHelper.error(
				`ProfilerConfig.loadFromFile: JSONC parse errors: ${errorMessages}`
			)
			throw new Error(
				`ProfilerConfig: Invalid ${STATIC_CONFIG_FILENAME} config file`
			)
		}

		const loadedConfig = ProfilerConfig.intermediateFromJSON(configJSON)
		loadedConfig.filePath = filePath

		if (loadedConfig.extends) {
			const configToExtendFilePath = filePath
				.dirName()
				.join(loadedConfig.extends)
			const configToExtend = ProfilerConfig.loadFromFile(configToExtendFilePath)

			if (configToExtend) {
				ProfilerConfig.implement(loadedConfig, configToExtend)
				return loadedConfig
			}
		}
		return loadedConfig
	}

	// loads a config from a given file path and fills all non defined values with the resp. default values
	static resolveFromFile(filePath: UnifiedPath | undefined): ProfilerConfig {
		if (!filePath) {
			return ProfilerConfig.getDefaultConfig()
		}
		const baseConfig = ProfilerConfig.defaultConfigAsIntermediate()

		const config = this.loadFromFile(filePath)
		if (config) {
			baseConfig.filePath = config.filePath
			if (config.projectOptions?.identifier === undefined) {
				throw new Error('ProfilerConfig: the project has no identifier yet')
			}
			ProfilerConfig.implement(config, baseConfig)

			try {
				if (ProfilerConfig.verifyConfig(config)) {
					return new ProfilerConfig(config.filePath, config)
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				if (err.name === 'ZodError') {
					ProfilerConfig.printZodError(err)
					throw new Error(
						`ProfilerConfig: Invalid ${STATIC_CONFIG_FILENAME} config file`
					)
				}
				throw err
			}
		}
		return new ProfilerConfig(baseConfig.filePath, baseConfig)
	}

	static autoResolveFromPath(startDir: UnifiedPath): ProfilerConfig {
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

	static autoResolve(): ProfilerConfig {
		// Searches from the processes execution path upwards until it finds the config file
		return this.autoResolveFromPath(new UnifiedPath(process.cwd()))
	}

	static async createMainConfig(options?: {
		projectOptions?: {
			identifier: ProjectIdentifier_string
		}
	}): Promise<ProfilerConfig> {
		const mainConfig = ProfilerConfig.getDefaultConfig()

		mainConfig.projectOptions.identifier =
			options?.projectOptions?.identifier ??
			((await Crypto.uniqueID()) as ProjectIdentifier_string)
		mainConfig.registryOptions = undefined as unknown as RegistryOptions
		// remove runtime options from main config
		mainConfig.runtimeOptions.sensorInterface = undefined
		return mainConfig
	}

	/**
	 * Function to initialize a local config file that extends the main config file
	 *
	 * @param options
	 * @returns
	 */
	static createLocalConfig(options: {
		selectedSensorInterface?: SensorInterfaceType
		sensorInterfaceSampleInterval?: MicroSeconds_number
	}): IProfilerConfigFileRepresentation {
		const localConfig: IProfilerConfigFileRepresentation = {}
		localConfig.runtimeOptions = {}
		switch (options.selectedSensorInterface) {
			case undefined:
				localConfig.runtimeOptions.sensorInterface = undefined
				break
			case SensorInterfaceType.perf:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.perf,
					options: {
						outputFilePath: 'energy-measurements.txt',
						sampleInterval:
							options.sensorInterfaceSampleInterval ??
							(100 as MicroSeconds_number)
					}
				}
				break
			case SensorInterfaceType.powermetrics:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.powermetrics,
					options: {
						outputFilePath: 'energy-measurements.plist',
						sampleInterval:
							options.sensorInterfaceSampleInterval ??
							(100 as MicroSeconds_number)
					}
				}
				break
			case SensorInterfaceType.windows:
				localConfig.runtimeOptions.sensorInterface = {
					type: SensorInterfaceType.windows,
					options: {
						outputFilePath: 'energy-measurements.csv',
						sampleInterval:
							options.sensorInterfaceSampleInterval ??
							(100 as MicroSeconds_number)
					}
				}
				break
			default:
				break
		}
		return localConfig
	}
}
