import * as fs from 'fs'

import {
	STATIC_CONFIG_FILENAME,
	DEFAULT_PROFILER_CONFIG
} from '../../src/constants/config'
import {
	ProfilerConfig,
	IProfilerConfigIntermediate
} from '../../src/model/ProfilerConfig'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { PathUtils } from '../../src/helper/PathUtils'
import { PermissionHelper } from '../../src/helper/PermissionHelper'
import {
	IProfilerConfig,
	SensorInterfaceType,
	ProjectIdentifier_string,
	MicroSeconds_number,
	IProfilerConfigFileRepresentation
} from '../../src/types'
import { LoggerHelper } from '../../src'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('ProfilerConfig', () => {
	describe('instance related', () => {
		let instance: ProfilerConfig

		beforeEach(() => {
			instance = new ProfilerConfig(CURRENT_DIR.join('config.json'), {
				exportOptions: {
					outDir: './profiles',
					outHistoryDir: './profiles_history',
					rootDir: './',
					exportV8Profile: true,
					exportReport: false,
					exportSensorInterfaceData: true
				},
				projectOptions: {
					identifier:
						'9662d888-085d-4b08-ad37-3526517a3240' as ProjectIdentifier_string
				},
				runtimeOptions: {
					seeds: {
						'Math.random': '<seed>'
					},
					v8: {
						cpu: {
							sampleInterval: 10 as MicroSeconds_number
						}
					},
					sensorInterface: {
						type: SensorInterfaceType.powermetrics,
						options: {
							outputFilePath: './sensorData/powermetrics',
							sampleInterval: 1000 as MicroSeconds_number
						}
					}
				},
				registryOptions: {
					url: 'localhost:4000/project-report'
				}
			})
		})

		it('instance should be an instanceof ProfilerConfig', () => {
			expect(instance instanceof ProfilerConfig).toBeTruthy()
		})

		it('should have a static method getDefaultConfig()', () => {
			expect(ProfilerConfig.getDefaultConfig).toBeTruthy()
		})

		it('should have a method getOutDir()', () => {
			expect(instance.getOutDir).toBeTruthy()
		})

		it('should have a method shouldExportV8Profile()', () => {
			expect(instance.shouldExportV8Profile).toBeTruthy()
		})

		it('should have a method getSensorInterfaceType()', () => {
			expect(instance.getSensorInterfaceType).toBeTruthy()
		})

		it('should have a method getSensorInterfaceOptions()', () => {
			expect(instance.getSensorInterfaceOptions).toBeTruthy()
		})

		it('should have a method shouldExportReport()', () => {
			expect(instance.shouldExportReport).toBeTruthy()
		})

		it('should have a method mathRandomSeed()', () => {
			expect(instance.getSeedForMathRandom).toBeTruthy()
		})

		it('should have a static method intermediateFromJSON()', () => {
			expect(ProfilerConfig.intermediateFromJSON).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a method storeToFile()', () => {
			expect(instance.storeToFile).toBeTruthy()
		})

		it('should have a static method loadFromFile()', () => {
			expect(ProfilerConfig.loadFromFile).toBeTruthy()
		})

		it('should have a static method resolveFromFile()', () => {
			expect(ProfilerConfig.resolveFromFile).toBeTruthy()
		})

		it('should have a static method autoResolve()', () => {
			expect(ProfilerConfig.autoResolve).toBeTruthy()
		})

		test('getter', () => {
			expect(instance.filePath.toString()).toBe(
				new UnifiedPath(__dirname).toString() + '/config.json'
			)
			expect(instance.extends).toBe(undefined)
			expect(instance.exportOptions).toEqual({
				outDir: './profiles',
				outHistoryDir: './profiles_history',
				rootDir: './',
				exportV8Profile: true,
				exportReport: false,
				exportSensorInterfaceData: true
			} satisfies IProfilerConfig['exportOptions'])

			expect(instance.registryOptions).toEqual({
				url: 'localhost:4000/project-report'
			})

			expect(instance.getOutDir().toString()).toBe(
				new UnifiedPath(__dirname).toString() + '/profiles'
			)
			expect(instance.getOutHistoryDir().toString()).toBe(
				new UnifiedPath(__dirname).toString() + '/profiles_history'
			)
			expect(instance.shouldExportV8Profile()).toBe(true)
			expect(instance.shouldExportReport()).toBe(false)
			expect(instance.shouldExportSensorInterfaceData()).toBe(true)
			expect(instance.getSeedForMathRandom()).toBe('<seed>')
			expect(instance.getSensorInterfaceType()).toBe('powermetrics')
			expect(instance.getSensorInterfaceOptions()).toEqual({
				outputFilePath: './sensorData/powermetrics',
				sampleInterval: 1000
			})
		})
		test('storeToFile', () => {
			const profilerConfigPath = CURRENT_DIR.join(
				'..',
				'..',
				'..',
				'..',
				'profiles',
				'test-profile',
				'.oaklean'
			)
			if (fs.existsSync(profilerConfigPath.dirName().toPlatformString())) {
				fs.rmSync(profilerConfigPath.dirName().toPlatformString(), {
					recursive: true
				})
			}

			instance.storeToFile(profilerConfigPath)

			expect(fs.existsSync(profilerConfigPath.toString())).toBeTruthy()
		})
		it('should serialize correctly', () => {
			const expected: IProfilerConfig = {
				exportOptions: {
					outDir: './profiles',
					outHistoryDir: './profiles_history',
					rootDir: './',
					exportV8Profile: true,
					exportReport: false,
					exportSensorInterfaceData: true
				},
				projectOptions: {
					identifier:
						'9662d888-085d-4b08-ad37-3526517a3240' as ProjectIdentifier_string
				},
				runtimeOptions: {
					seeds: {
						'Math.random': '<seed>'
					},
					v8: {
						cpu: {
							sampleInterval: 10 as MicroSeconds_number
						}
					},
					sensorInterface: {
						type: SensorInterfaceType.powermetrics,
						options: {
							outputFilePath: './sensorData/powermetrics',
							sampleInterval: 1000 as MicroSeconds_number
						}
					}
				},
				registryOptions: {
					url: 'localhost:4000/project-report'
				}
			}
			expect(instance.toJSON()).toEqual(expected)
		})
	})
	describe('deserialization', () => {
		const expected: IProfilerConfig = {
			extends: '../config.json',
			exportOptions: {
				outDir: './profiles',
				outHistoryDir: './profiles_history',
				rootDir: './',
				exportV8Profile: true,
				exportReport: false,
				exportSensorInterfaceData: true
			},
			projectOptions: {
				identifier:
					'9662d888-085d-4b08-ad37-3526517a3240' as ProjectIdentifier_string
			},
			runtimeOptions: {
				seeds: {
					'Math.random': '<seed>'
				},
				v8: {
					cpu: {
						sampleInterval: 10 as MicroSeconds_number
					}
				},
				sensorInterface: {
					type: SensorInterfaceType.powermetrics,
					options: {
						outputFilePath: './sensorData/powermetrics',
						sampleInterval: 1000 as MicroSeconds_number
					}
				}
			},
			registryOptions: {
				url: 'localhost:4000/project-report'
			}
		}

		test('test deserialization of intermediate from string', () => {
			const configFromString = ProfilerConfig.intermediateFromJSON(
				JSON.stringify(expected)
			)
			expect(configFromString).toEqual({
				...expected,
				filePath: new UnifiedPath('./')
			} satisfies IProfilerConfigIntermediate)
		})

		test('test deserialization of intermediate from object', () => {
			const configFromObject = ProfilerConfig.intermediateFromJSON(expected)
			expect(configFromObject).toEqual({
				...expected,
				filePath: new UnifiedPath('./')
			} satisfies IProfilerConfigIntermediate)
		})
	})
	describe('loading from File', () => {
		test('ProfilerConfig.getDefaultConfig', () => {
			const config = ProfilerConfig.getDefaultConfig()

			expect(config.filePath.toString()).toBe(
				new UnifiedPath(process.cwd()).join(STATIC_CONFIG_FILENAME).toString()
			)

			expect(config.exportOptions).toEqual(
				DEFAULT_PROFILER_CONFIG.exportOptions
			)

			expect(config.getOutDir().toString()).toBe(
				new UnifiedPath(process.cwd())
					.join(STATIC_CONFIG_FILENAME)
					.dirName()
					.join(DEFAULT_PROFILER_CONFIG.exportOptions.outDir)
					.toString()
			)
			expect(config.shouldExportV8Profile()).toBe(
				DEFAULT_PROFILER_CONFIG.exportOptions.exportV8Profile
			)
			expect(config.shouldExportReport()).toBe(
				DEFAULT_PROFILER_CONFIG.exportOptions.exportReport
			)
			expect(config.shouldExportSensorInterfaceData()).toBe(
				DEFAULT_PROFILER_CONFIG.exportOptions.exportSensorInterfaceData
			)
		})
		test('loadFromFile: no path given', () => {
			const configFilePath = new UnifiedPath('abc')
			const config = ProfilerConfig.loadFromFile(configFilePath)

			expect(config).toBeUndefined()
		})
		test('loadFromFile', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.oaklean'
			)
			const config = ProfilerConfig.loadFromFile(configFilePath)

			if (!config) {
				expect(config).toBeDefined()
			} else {
				expect(config).toEqual({
					extends: '.oaklean.local',
					filePath: configFilePath,
					exportOptions: {
						outDir: 'profile-path',
						outHistoryDir: 'profiles-history-path',
						exportV8Profile: false,
						exportReport: false,
						exportSensorInterfaceData: true,
						rootDir: '../../../../'
					},
					projectOptions: {
						identifier:
							'42c89abd-3877-4039-99e8-c36d6dd74ddd' as ProjectIdentifier_string
					},
					runtimeOptions: {
						seeds: {
							'Math.random': '<seed>'
						},
						sensorInterface: {
							type: SensorInterfaceType.powermetrics,
							options: {
								outputFilePath: './sensorData/powermetrics',
								sampleInterval: 1000 as MicroSeconds_number
							}
						},
						v8: {
							cpu: {
								sampleInterval: 10 as MicroSeconds_number
							}
						}
					},
					registryOptions: {
						url: 'domain/project-report'
					}
				} satisfies IProfilerConfigIntermediate)
			}
		})
		test('loadFromFile: empty file', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.empty-oaklean'
			)
			const config = ProfilerConfig.loadFromFile(configFilePath)

			expect(config).toEqual({
				filePath: configFilePath
			} satisfies IProfilerConfigIntermediate)
		})
		test('loadFromFile: minimal viable file', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.min-oaklean'
			)
			const config = ProfilerConfig.loadFromFile(configFilePath)

			expect(config).toEqual({
				filePath: configFilePath,
				projectOptions: {
					identifier:
						'42c89abd-3877-4039-99e8-c36d6dd74ddd' as ProjectIdentifier_string
				}
			} satisfies IProfilerConfigIntermediate)
		})
		test('loadFromFile that gets extended', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'subDir',
				'subDir',
				'.oaklean'
			)
			const config = ProfilerConfig.loadFromFile(configFilePath)

			if (!config) {
				expect(config).toBeDefined()
			} else {
				expect(config).toEqual({
					filePath: configFilePath,
					exportOptions: {
						outDir: '../../profile-path',
						outHistoryDir: '../../profiles-history-path',
						exportV8Profile: false,
						exportReport: true,
						exportSensorInterfaceData: false,
						rootDir: '../../../../../..'
					},
					projectOptions: {
						identifier:
							'59cbfe64-d3e0-4610-adda-8a63244b237c' as ProjectIdentifier_string
					},
					extends: '../../.oaklean',
					runtimeOptions: {
						seeds: {
							'Math.random': '<seed>'
						},
						v8: {
							cpu: {
								sampleInterval: 11 as MicroSeconds_number
							}
						},
						sensorInterface: {
							type: SensorInterfaceType.powermetrics,
							options: {
								outputFilePath: './sensorData/powermetrics',
								sampleInterval: 1000 as MicroSeconds_number
							}
						}
					},
					registryOptions: {
						url: 'example.com/project-report'
					}
				} satisfies IProfilerConfigIntermediate)
			}
		})
	})
	describe('resolve from file', () => {
		test('ProfilerConfig.resolveFromFile', () => {
			const expectedOutDirPath = CURRENT_DIR.join(
				'assets',
				'ProfilerConfig',
				'profile-path'
			)
			const expectedRootDirPath = CURRENT_DIR.join('..', '..')
			const profilerConfigPath = CURRENT_DIR.join(
				'assets',
				'ProfilerConfig',
				'subDir',
				'subDir',
				'.oaklean'
			)
			const config = ProfilerConfig.resolveFromFile(profilerConfigPath)

			expect(config.toJSON()).toEqual({
				exportOptions: {
					exportReport: true,
					exportV8Profile: false,
					exportSensorInterfaceData: false,
					outDir: '../../profile-path',
					outHistoryDir: '../../profiles-history-path',
					rootDir: '../../../../../..'
				},
				extends: '../../.oaklean',
				projectOptions: {
					identifier:
						'59cbfe64-d3e0-4610-adda-8a63244b237c' as ProjectIdentifier_string
				},
				registryOptions: {
					url: 'example.com/project-report'
				},
				runtimeOptions: {
					seeds: {
						'Math.random': '<seed>'
					},
					sensorInterface: {
						options: {
							outputFilePath: './sensorData/powermetrics',
							sampleInterval: 1000 as MicroSeconds_number
						},
						type: SensorInterfaceType.powermetrics
					},
					v8: {
						cpu: {
							sampleInterval: 11 as MicroSeconds_number
						}
					}
				}
			} satisfies IProfilerConfig)

			expect(config.getRootDir().toString()).toBe(
				expectedRootDirPath.toString()
			)
			expect(config.getV8CPUSamplingInterval()).toBe(11)
			expect(config.getProjectIdentifier()).toBe(
				'59cbfe64-d3e0-4610-adda-8a63244b237c'
			)
			expect(config.getOutDir().toString()).toBe(expectedOutDirPath.toString())
			expect(config.shouldExportV8Profile()).toBe(false)
			expect(config.shouldExportReport()).toBe(true)
			expect(config.shouldExportSensorInterfaceData()).toBe(false)
		})

		test('ProfilerConfig.resolveFromFile that contains no auth key but extends from a file that has one', () => {
			const expectedOutDirPath = CURRENT_DIR.join(
				'assets',
				'ProfilerConfig',
				'profile-path'
			)
			const expectedRootDirPath = CURRENT_DIR.join('..', '..')
			const profilerConfigPath = CURRENT_DIR.join(
				'assets',
				'ProfilerConfig',
				'subDir',
				'subDir',
				'.oaklean-without-auth-key'
			)
			const config = ProfilerConfig.resolveFromFile(profilerConfigPath)

			expect(config.toJSON()).toEqual({
				exportOptions: {
					exportReport: true,
					exportV8Profile: false,
					exportSensorInterfaceData: false,
					outDir: '../../profile-path',
					outHistoryDir: '../../profiles-history-path',
					rootDir: '../../../../../..'
				},
				extends: '../../.oaklean',
				projectOptions: {
					identifier:
						'42c89abd-3877-4039-99e8-c36d6dd74ddd' as ProjectIdentifier_string
				},
				registryOptions: {
					url: 'example.com/project-report'
				},
				runtimeOptions: {
					seeds: {
						'Math.random': '<seed>'
					},
					sensorInterface: {
						options: {
							outputFilePath: './sensorData/powermetrics',
							sampleInterval: 1000 as MicroSeconds_number
						},
						type: SensorInterfaceType.powermetrics
					},
					v8: {
						cpu: {
							sampleInterval: 11 as MicroSeconds_number
						}
					}
				}
			} satisfies IProfilerConfig)

			expect(config.getRootDir().toString()).toBe(
				expectedRootDirPath.toString()
			)
			expect(config.getV8CPUSamplingInterval()).toBe(11)
			expect(config.getProjectIdentifier()).toBe(
				'42c89abd-3877-4039-99e8-c36d6dd74ddd'
			)
			expect(config.getOutDir().toString()).toBe(expectedOutDirPath.toString())
			expect(config.shouldExportV8Profile()).toBe(false)
			expect(config.shouldExportReport()).toBe(true)
			expect(config.shouldExportSensorInterfaceData()).toBe(false)
		})

		test('ProfilerConfig.resolveFromFile that contains an auth key and extends from a file that has none', () => {
			const profilerConfigPath = CURRENT_DIR.join(
				'assets',
				'ProfilerConfig',
				'subDir',
				'subDir',
				'.oaklean-with-auth-key'
			)
			const expectedOutDirPath = profilerConfigPath.dirName().join('profiles')
			const expectedRootDirPath = profilerConfigPath.dirName()
			const config = ProfilerConfig.resolveFromFile(profilerConfigPath)

			expect(config.toJSON()).toEqual({
				...DEFAULT_PROFILER_CONFIG,
				extends: '../../.empty-oaklean',
				projectOptions: {
					identifier:
						'52c89abd-3877-4039-99e8-c36d6dd74ddd' as ProjectIdentifier_string
				}
			} satisfies IProfilerConfig)

			expect(config.getRootDir().toString()).toBe(
				expectedRootDirPath.toString()
			)
			expect(config.getV8CPUSamplingInterval()).toBe(1)
			expect(config.getProjectIdentifier()).toBe(
				'52c89abd-3877-4039-99e8-c36d6dd74ddd'
			)
			expect(config.getOutDir().toString()).toBe(expectedOutDirPath.toString())
			expect(config.shouldExportV8Profile()).toBe(false)
			expect(config.shouldExportReport()).toBe(true)
			expect(config.shouldExportSensorInterfaceData()).toBe(false)
		})

		it('ProfilerConfig.resolveFromFile returns the baseConfig if given config file is undefined', () => {
			const config = ProfilerConfig.resolveFromFile(undefined)

			expect(config.toJSON()).toEqual(
				ProfilerConfig.getDefaultConfig().toJSON()
			)
		})
		it('ProfilerConfig.resolveFromFile returns the baseConfig if given config file path does not exist', () => {
			const config = ProfilerConfig.resolveFromFile(
				new UnifiedPath('abc/def.json')
			)

			expect(config.toJSON()).toEqual(
				ProfilerConfig.getDefaultConfig().toJSON()
			)
		})
		test('ProfilerConfig.resolveFromFile: empty file', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.empty-oaklean'
			)
			const t = () => {
				ProfilerConfig.resolveFromFile(configFilePath)
			}

			expect(t).toThrow('ProfilerConfig: the project has no identifier yet')
		})
		test('ProfilerConfig.resolveFromFile: minimal viable file', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.min-oaklean'
			)
			const expectedOutDirPath = configFilePath.dirName().join('profiles')
			const expectedRootDirPath = configFilePath.dirName()
			const config = ProfilerConfig.resolveFromFile(configFilePath)

			expect(config?.toJSON()).toEqual({
				...DEFAULT_PROFILER_CONFIG,
				extends: undefined,
				projectOptions: {
					identifier: '42c89abd-3877-4039-99e8-c36d6dd74ddd'
				}
			})

			expect(config.getRootDir().toString()).toBe(
				expectedRootDirPath.toString()
			)
			expect(config.getV8CPUSamplingInterval()).toBe(1)
			expect(config.getProjectIdentifier()).toBe(
				'42c89abd-3877-4039-99e8-c36d6dd74ddd'
			)
			expect(config.getOutDir().toString()).toBe(expectedOutDirPath.toString())
			expect(config.shouldExportV8Profile()).toBe(false)
			expect(config.shouldExportReport()).toBe(true)
			expect(config.shouldExportSensorInterfaceData()).toBe(false)
		})
		test('ProfilerConfig.resolveFromFile: invalid file', () => {
			const configFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'.invalid-oaklean'
			)

			const errorStub = jest
				.spyOn(LoggerHelper, 'error')
				.mockImplementation(() => undefined)
			const t = () => {
				ProfilerConfig.resolveFromFile(configFilePath)
			}
			expect(t).toThrow('ProfilerConfig: Invalid .oaklean config file')
			expect(errorStub).toHaveBeenCalled()
			errorStub.mockRestore()
		})

		test('ProfilerConfig.autoResolve', () => {
			const expectedOutDirPath = CURRENT_DIR.join(
				'..',
				'..',
				'..',
				'..',
				'profiles'
			)
			const config = ProfilerConfig.autoResolve()

			expect(config.getOutDir().toString()).toBe(expectedOutDirPath.toString())
			expect(config.shouldExportV8Profile()).toBe(true)
			expect(config.shouldExportReport()).toBe(true)
			expect(config.shouldExportSensorInterfaceData()).toBe(true)
		})
		test('ProfilerConfig.autoResolve: returns baseConfig if no config can be resolved', () => {
			const findUpMock = jest.fn()
			findUpMock.mockReturnValue(undefined)
			PathUtils.findUp = findUpMock

			const expectedConfig = ProfilerConfig.resolveFromFile(undefined)
			const config = ProfilerConfig.autoResolve()

			expect(config.toJSON()).toEqual(expectedConfig.toJSON())
			findUpMock.mockRestore()
		})

		test('ProfilerConfig.autoResolve: resolve from linux file', () => {
			const testCases = [
				{
					fileName: '.oaklean.extend-linux',
					extends: '.oaklean.linux',
					identifier: '12c89abd-3877-4039-99e8-c36d6dd74ddd',
					sensorInterfaceType: SensorInterfaceType.perf,
					outputFilePath: 'energy-measurements.txt'
				},
				{
					fileName: '.oaklean.extend-mac',
					extends: '.oaklean.mac',
					identifier: '22c89abd-3877-4039-99e8-c36d6dd74ddd',
					sensorInterfaceType: SensorInterfaceType.powermetrics,
					outputFilePath: 'energy-measurements.plist'
				},
				{
					fileName: '.oaklean.extend-windows',
					extends: '.oaklean.windows',
					identifier: '32c89abd-3877-4039-99e8-c36d6dd74ddd',
					sensorInterfaceType: SensorInterfaceType.windows,
					outputFilePath: 'energy-measurements.csv'
				}
			]

			for (const testCase of testCases) {
				const configFilePath = new UnifiedPath(__dirname).join(
					'assets',
					'ProfilerConfig',
					'platform',
					testCase.fileName
				)
				const expectedOutDirPath = configFilePath.dirName().join('profiles')
				const expectedRootDirPath = configFilePath.dirName()

				const config = ProfilerConfig.resolveFromFile(configFilePath)
				expect(config.toJSON()).toEqual({
					...DEFAULT_PROFILER_CONFIG,
					extends: testCase.extends,
					projectOptions: {
						identifier: testCase.identifier
					},
					runtimeOptions: {
						seeds: DEFAULT_PROFILER_CONFIG.runtimeOptions.seeds,
						v8: DEFAULT_PROFILER_CONFIG.runtimeOptions.v8,
						sensorInterface: {
							type: testCase.sensorInterfaceType,
							options: {
								outputFilePath: testCase.outputFilePath,
								sampleInterval: 100 as MicroSeconds_number
							}
						}
					}
				} satisfies IProfilerConfig)

				expect(config.getRootDir().toString()).toBe(
					expectedRootDirPath.toString()
				)
				expect(config.getV8CPUSamplingInterval()).toBe(1)
				expect(config.getProjectIdentifier()).toBe(testCase.identifier)
				expect(config.getOutDir().toString()).toBe(
					expectedOutDirPath.toString()
				)
				expect(config.shouldExportV8Profile()).toBe(false)
				expect(config.shouldExportReport()).toBe(true)
				expect(config.shouldExportSensorInterfaceData()).toBe(false)
				expect(config.getSensorInterfaceType()).toBe(
					testCase.sensorInterfaceType
				)
				expect(config.getSensorInterfaceOptions()).toEqual({
					outputFilePath: testCase.outputFilePath,
					sampleInterval: 100
				})
			}
		})
	})
	describe('special cases', () => {
		test('getOutDir with absolute outDir', () => {
			const config = new ProfilerConfig(new UnifiedPath('./config.json'), {
				exportOptions: {
					outDir: '/absolute/path/to/profiles',
					outHistoryDir: './profiles_history',
					rootDir: './',
					exportV8Profile: true,
					exportReport: false,
					exportSensorInterfaceData: true
				},
				projectOptions: {
					identifier:
						'9662d888-085d-4b08-ad37-3526517a3240' as ProjectIdentifier_string
				},
				runtimeOptions: {
					seeds: {
						'Math.random': '<seed>'
					},
					v8: {
						cpu: {
							sampleInterval: 10 as MicroSeconds_number
						}
					}
				},
				registryOptions: {
					url: 'localhost:4000/project-report'
				}
			})
			expect(config.getOutDir().toString()).toBe('/absolute/path/to/profiles')
		})
	})

	describe('jsonc-parser comments preservation', () => {
		test('storeToFile and storeIntermediateToFile preserves comments', async () => {
			const mainConfig = await ProfilerConfig.createMainConfig({
				projectOptions: {
					identifier:
						'12c89abd-3877-4039-99e8-c36d6dd74ddd' as ProjectIdentifier_string
				}
			})
			mainConfig.extends = '.oaklean.linux'

			const localConfig = ProfilerConfig.createLocalConfig({
				selectedSensorInterface: SensorInterfaceType.perf,
				sensorInterfaceSampleInterval: 100 as MicroSeconds_number
			})

			const mainConfigPath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'jsonc',
				'.oaklean.extend-linux'
			)
			const localConfigPath = new UnifiedPath(__dirname).join(
				'assets',
				'ProfilerConfig',
				'jsonc',
				'.oaklean.linux'
			)

			const beforeMain = fs
				.readFileSync(mainConfigPath.toPlatformString())
				.toString()
			const beforeLocal = fs
				.readFileSync(localConfigPath.toPlatformString())
				.toString()

			mainConfig.storeToFile(mainConfigPath)
			ProfilerConfig.storeIntermediateToFile(localConfigPath, localConfig)

			const afterMain = fs
				.readFileSync(mainConfigPath.toPlatformString())
				.toString()
			const afterLocal = fs
				.readFileSync(localConfigPath.toPlatformString())
				.toString()

			// reset files
			PermissionHelper.writeFileWithUserPermission(mainConfigPath, beforeMain)
			PermissionHelper.writeFileWithUserPermission(localConfigPath, beforeLocal)

			expect(afterMain).toEqual(beforeMain)
			expect(afterLocal).toEqual(beforeLocal)
		})
	})
})
