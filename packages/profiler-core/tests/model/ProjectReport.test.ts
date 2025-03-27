import * as fs from 'fs'

import { UnifiedPath } from '../../src/system/UnifiedPath'
import { ProjectReport } from '../../src/model/ProjectReport'
import {
	NodeModule
} from '../../src/model/NodeModule'
import { VERSION } from '../../src/constants/app'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'
import { GitHelper } from '../../src/helper/GitHelper'
import { ProfilerConfig } from '../../src/model/ProfilerConfig'
import { GlobalIndex } from '../../src/model/indices/GlobalIndex'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import { PermissionHelper } from '../../src/helper/PermissionHelper'
import { ExternalResourceHelper } from '../../src/helper/ExternalResourceHelper'
import { LoggerHelper } from '../../src/helper/LoggerHelper'
import {
	UnifiedPath_string,
	IProjectReport,
	ProjectIdentifier_string,
	ProjectReportOrigin,
	IProjectReportExecutionDetails,
	ISourceNodeMetaData,
	SourceNodeMetaDataType,
	SourceNodeIdentifier_string,
	NodeModuleIdentifier_string,
	ISystemInformation,
	GitHash_string,
	SensorInterfaceType,
	ISensorValues,
	MilliJoule_number,
	PathID_number,
	ModuleID_number,
	ISourceNodeIndex,
	SourceNodeID_number,
	SourceNodeIndexType,
	MicroSeconds_number,
	ReportKind
} from '../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ROOT_DIR = CURRENT_DIR.join('..', '..', '..', '..')

const EXAMPLE_SYSTEM_INFORMATION: ISystemInformation = JSON.parse(
	fs.readFileSync(CURRENT_DIR.join('assets', 'SystemInformation', 'example.json').toString()).toString()
) as ISystemInformation

const EXAMPLE_EXECUTION_DETAILS = {
	origin: ProjectReportOrigin.pure,
	commitHash: '9828760b10d33c0fd06ed12cd6b6edf9fc4d6db0' as GitHash_string,
	commitTimestamp: 1687845481077,
	timestamp: 1687845481077,
	uncommittedChanges: false,
	systemInformation: EXAMPLE_SYSTEM_INFORMATION,
	languageInformation: {
		name: 'node',
		version: '20.11.1'
	},
	runTimeOptions: {
		seeds: {
			'Math.random': '0'
		},
		v8: {
			cpu: {
				sampleInterval: 1 as MicroSeconds_number
			}
		},
		sensorInterface: {
			type: SensorInterfaceType.powermetrics,
			options: {
				sampleInterval: 1000 as MicroSeconds_number,
				outputFilePath: '<anonymized>'
			}
		}
	}
} satisfies IProjectReportExecutionDetails

const EXAMPLE_PROJECT_REPORT: IProjectReport = {
	reportVersion: VERSION,
	kind: ReportKind.measurement,
	relativeRootDir: './' as UnifiedPath_string,
	projectMetaData: {
		projectID: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' as ProjectIdentifier_string
	},
	lang_internalHeadlessSensorValues: {},
	executionDetails: EXAMPLE_EXECUTION_DETAILS,
	globalIndex: {
		currentId: 11,
		moduleMap: {
			['{self}' as NodeModuleIdentifier_string]: {
				id: 0 as ModuleID_number,
				children: {
					'dist': {
						children: {
							'test.js': {
								id: 1 as PathID_number,
								file: {
									'{root}': {
										children: {
											'{class:Class}': {
												children: {
													'{method:method}': {
														children: {
															'{functionExpression:0}': {
																id: 2 as SourceNodeID_number
															}
														}
													} as unknown as ISourceNodeIndex<SourceNodeIndexType.Intermediate>,
													'{method:method2}': {
														id: 6 as SourceNodeID_number
													}
												}
											} as unknown as ISourceNodeIndex<SourceNodeIndexType.Intermediate>
										}
									} as unknown as ISourceNodeIndex<SourceNodeIndexType.Intermediate>
								}
							}
						}
					}
				}
			},
			['{node}' as NodeModuleIdentifier_string]: {
				id: 3 as ModuleID_number,
				children: {
					'': {
						id: 4 as PathID_number,
						file: {
							'{root}': {
								id: 5 as SourceNodeID_number
							}
						}
					}
				}
			},
			['@oaklean/profiler-core@0.0.4' as NodeModuleIdentifier_string]: {
				id: 7 as ModuleID_number,
				children: {
					'test.js': {
						id: 8 as PathID_number,
						file: {
							'{root}': {
								children: {
									'{class:Package}': {
										children: {
											'{method:method}': {
												id: 9 as SourceNodeID_number
											},
											'{method:method2}': {
												id: 10 as SourceNodeID_number
											}
										}
									} as unknown as ISourceNodeIndex<SourceNodeIndexType.Intermediate>
								}
							} as unknown as ISourceNodeIndex<SourceNodeIndexType.Intermediate>
						}
					}
				}
			}
		}
	},
	intern: {
		[1 as PathID_number]: {
			path: './dist/test.js' as UnifiedPath_string,
			functions: {
				[2 as SourceNodeID_number]: {
					id: 2 as SourceNodeID_number,
					type: SourceNodeMetaDataType.SourceNode,
					sensorValues: {
						selfCPUTime: 20,
						aggregatedCPUTime: 30,
						langInternalCPUTime: 10,

						selfCPUEnergyConsumption: 40,
						aggregatedCPUEnergyConsumption: 60,
						langInternalCPUEnergyConsumption: 20,

						selfRAMEnergyConsumption: 40,
						aggregatedRAMEnergyConsumption: 60,
						langInternalRAMEnergyConsumption: 20
					} as ISensorValues,
					lang_internal: {
						[5 as SourceNodeID_number]: {
							id: 5 as SourceNodeID_number,
							type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
							sensorValues: {
								aggregatedCPUTime: 10,
								aggregatedCPUEnergyConsumption: 20,

								aggregatedRAMEnergyConsumption: 20
							} as ISensorValues
						}
					}
				} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
				[6 as SourceNodeID_number]: {
					id: 6 as SourceNodeID_number,
					type: SourceNodeMetaDataType.SourceNode,
					sensorValues: {
						selfCPUTime: 30,
						aggregatedCPUTime: 60,
						langInternalCPUTime: 30,

						selfCPUEnergyConsumption: 60,
						aggregatedCPUEnergyConsumption: 120,
						langInternalCPUEnergyConsumption: 60,

						selfRAMEnergyConsumption: 60,
						aggregatedRAMEnergyConsumption: 120,
						langInternalRAMEnergyConsumption: 60
					} as ISensorValues,
					lang_internal: {
						[5 as SourceNodeID_number]: {
							id: 5 as SourceNodeID_number,
							type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
							sensorValues: {
								aggregatedCPUTime: 30,

								aggregatedCPUEnergyConsumption: 60,

								aggregatedRAMEnergyConsumption: 60
							} as ISensorValues
						} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
					}
				}
			}
		}
	},
	extern: {
		[7 as ModuleID_number]: {
			reportVersion: VERSION,
			kind: ReportKind.measurement,
			nodeModule: {
				name: '@oaklean/profiler-core',
				version: '0.0.4',
			},
			lang_internalHeadlessSensorValues: {},
			intern: {
				[8 as PathID_number]: {
					path: './test.js' as UnifiedPath_string,
					functions: {
						[9 as SourceNodeID_number]: {
							id: 9 as SourceNodeID_number,
							type: SourceNodeMetaDataType.SourceNode,
							sensorValues: {
								selfCPUTime: 10,
								aggregatedCPUTime: 10,

								selfCPUEnergyConsumption: 20,
								aggregatedCPUEnergyConsumption: 20,

								selfRAMEnergyConsumption: 20,
								aggregatedRAMEnergyConsumption: 20
							} as ISensorValues
						} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
						[10 as SourceNodeID_number]: {
							id: 10 as SourceNodeID_number,
							type: SourceNodeMetaDataType.SourceNode,
							sensorValues: {
								selfCPUTime: 80,
								aggregatedCPUTime: 80,

								selfCPUEnergyConsumption: 160,
								aggregatedCPUEnergyConsumption: 160,

								selfRAMEnergyConsumption: 160,
								aggregatedRAMEnergyConsumption: 160
							} as ISensorValues
						} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					}
				}
			}
		}
	},
}

const EXAMPLE_PROJECT_REPORT_BUFFER = fs.readFileSync(CURRENT_DIR.join('assets', 'ProjectReport', 'instance.buffer').toString()).toString()
const EXAMPLE_PROJECT_REPORT_HASH = fs.readFileSync(CURRENT_DIR.join('assets', 'ProjectReport', 'instance.hash').toString()).toString()

const EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE001 = CURRENT_DIR.join('assets', 'ExternalResourceHelper', 'example001.resources.json')
const EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE002 = CURRENT_DIR.join('assets', 'ExternalResourceHelper', 'example002.resources.json')

/**
 * Preprocess the external resource files to ensure that source maps are relative and do not contain absolute paths.
 * So the tests can be run on different machines.
 */
async function preprocess() {
	for (const externalResourceHelperPath of [
		EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE001,
		EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE002
	]) {
		const externalResourceHelper = ExternalResourceHelper.loadFromFile(ROOT_DIR, externalResourceHelperPath)

		if (externalResourceHelper === undefined) {
			console.error('Failed to load ExternalResourceHelper')
			return
		}

		for (const scriptId of externalResourceHelper.scriptIDs) {
			const sourceMap = (await externalResourceHelper.sourceMapFromScriptID(
				scriptId,
				externalResourceHelperPath,
			))?.copy()

			if (sourceMap !== undefined && sourceMap !== null) {
				const newSources = sourceMap.sources.map((source) => {
					return new UnifiedPath(new UnifiedPath(source).basename()).toString()
				})
				sourceMap.sources = newSources
				externalResourceHelper.replaceSourceMapByScriptID(scriptId, sourceMap)
			}
		}

		for (const loadedFilePath of externalResourceHelper.loadedFilePaths) {
			const filePath = new UnifiedPath(loadedFilePath)
			const sourceMap = (await externalResourceHelper.sourceMapFromPath(
				filePath,
				filePath)
			)?.copy()

			if (sourceMap !== undefined && sourceMap !== null) {
				const newSources = sourceMap.sources.map((source) => {
					return new UnifiedPath(new UnifiedPath(source).basename()).toString()
				})
				sourceMap.sources = newSources
				externalResourceHelper.replaceSourceMapByLoadedFile(filePath, sourceMap)
			}
		}

		externalResourceHelper.storeToFile(externalResourceHelperPath, 'pretty-json')
	}
}

preprocess()
function runInstanceTests(title: string, preDefinedInstance: () => ProjectReport) {
	describe(title, () => {
		let instance: ProjectReport

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof ProjectReport', () => {
			expect(instance instanceof ProjectReport).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(ProjectReport.fromJSON).toBeTruthy()
		})

		it('should have a static method merge()', () => {
			expect(ProjectReport.merge).toBeTruthy()
		})

		it('should have a method storeToFile()', () => {
			expect(instance.storeToFile).toBeTruthy()
		})

		it('should have a static method loadFromFile()', () => {
			expect(ProjectReport.loadFromFile).toBeTruthy()
		})

		it('should have a method addSensorValuesToIntern()', () => {
			expect(instance.addSensorValuesToIntern).toBeTruthy()
		})

		it('should have a method addSensorValuesToIntern()', () => {
			expect(instance.addSensorValuesToIntern).toBeTruthy()
		})

		it('should have a method insertCPUProfile()', () => {
			expect(instance.insertCPUProfile).toBeTruthy()
		})

		it('should have a method getMetaDataFromFile()', () => {
			expect(instance.getMetaDataFromFile).toBeTruthy()
		})

		test('engineModule', () => {
			const engineModule = instance.engineModule
			expect(engineModule.toJSON()).toEqual({
				name: 'node',
				version: '20.11.1'
			})
		})

		test('addCPUTimeToExtern', () => {
			const nodeModule = new NodeModule('module', '1.2.3')

			instance.addSensorValuesToExtern(
				new UnifiedPath('./file'),
				nodeModule,
				'{root}{class:Class}.{method:method}' as SourceNodeIdentifier_string,
				{
					cpuTime: {
						selfCPUTime: 222 as MicroSeconds_number,
						aggregatedCPUTime: 222 as MicroSeconds_number
					},
					cpuEnergyConsumption: {
						selfCPUEnergyConsumption: 444 as MilliJoule_number,
						aggregatedCPUEnergyConsumption: 444 as MilliJoule_number
					},
					ramEnergyConsumption: {
						selfRAMEnergyConsumption: 444 as MilliJoule_number,
						aggregatedRAMEnergyConsumption: 444 as MilliJoule_number
					}
				}
			)
			const moduleID = instance.globalIndex.getModuleIndex('get', nodeModule.identifier)?.id as ModuleID_number

			expect(instance.extern.get(moduleID)?.getMetaDataFromFile(
				new UnifiedPath('./report.oak'),
				new UnifiedPath('./file')
			)?.functions.toJSON()).toEqual({
				13: {
					type: SourceNodeMetaDataType.SourceNode,
					id: 13,
					sensorValues: {
						selfCPUTime: 222,
						aggregatedCPUTime: 222,

						selfCPUEnergyConsumption: 444,
						aggregatedCPUEnergyConsumption: 444,

						selfRAMEnergyConsumption: 444,
						aggregatedRAMEnergyConsumption: 444,
					}
				} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
			})
		})

		describe('getCPUTimeFromFile', () => {
			test('should return the getCPUTimeFromFile correctly', () => {
				expect(instance.getMetaDataFromFile(
					new UnifiedPath('./report.oak'),
					new UnifiedPath('./dist/test.js')
				)?.functions.toJSON()).toEqual({
					2: {
						id: 2 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							selfCPUTime: 20 as MicroSeconds_number,
							aggregatedCPUTime: 30 as MicroSeconds_number,
							langInternalCPUTime: 10 as MicroSeconds_number,

							selfCPUEnergyConsumption: 40 as MilliJoule_number,
							aggregatedCPUEnergyConsumption: 60 as MilliJoule_number,
							langInternalCPUEnergyConsumption: 20 as MilliJoule_number,

							selfRAMEnergyConsumption: 40 as MilliJoule_number,
							aggregatedRAMEnergyConsumption: 60 as MilliJoule_number,
							langInternalRAMEnergyConsumption: 20 as MilliJoule_number
						},
						lang_internal: {
							5: {
								id: 5 as SourceNodeID_number,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									aggregatedCPUTime: 10,

									aggregatedCPUEnergyConsumption: 20,

									aggregatedRAMEnergyConsumption: 20
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					6: {
						id: 6 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							selfCPUTime: 30 as MicroSeconds_number,
							aggregatedCPUTime: 60 as MicroSeconds_number,
							langInternalCPUTime: 30 as MicroSeconds_number,

							selfCPUEnergyConsumption: 60 as MilliJoule_number,
							aggregatedCPUEnergyConsumption: 120 as MilliJoule_number,
							langInternalCPUEnergyConsumption: 60 as MilliJoule_number,

							selfRAMEnergyConsumption: 60 as MilliJoule_number,
							aggregatedRAMEnergyConsumption: 120 as MilliJoule_number,
							langInternalRAMEnergyConsumption: 60 as MilliJoule_number
						},
						lang_internal: {
							5: {
								id: 5 as SourceNodeID_number,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									aggregatedCPUTime: 30,

									aggregatedCPUEnergyConsumption: 60,

									aggregatedRAMEnergyConsumption: 60
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
				})
			})

			test('absolute paths', () => {
				instance.addSensorValuesToIntern(
					new UnifiedPath('/abs/path/to/file').toString(),
					'{root}{class:Class}.{method:method}' as SourceNodeIdentifier_string,
					{
						cpuTime: {
							selfCPUTime: 456 as MicroSeconds_number,
							aggregatedCPUTime: 456 as MicroSeconds_number
						},
						cpuEnergyConsumption: {
							selfCPUEnergyConsumption: 912 as MilliJoule_number,
							aggregatedCPUEnergyConsumption: 912 as MilliJoule_number
						},
						ramEnergyConsumption: {
							selfRAMEnergyConsumption: 912 as MilliJoule_number,
							aggregatedRAMEnergyConsumption: 912 as MilliJoule_number
						}
					}
				)
				instance.relativeRootDir = undefined
				expect(instance.getMetaDataFromFile(
					new UnifiedPath('./report.oak'),
					new UnifiedPath('/abs/path/to/file')
				)?.functions.toJSON()).toEqual({
					12: {
						id: 12 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							selfCPUTime: 456,
							aggregatedCPUTime: 456,

							selfCPUEnergyConsumption: 912,
							aggregatedCPUEnergyConsumption: 912,

							selfRAMEnergyConsumption: 912,
							aggregatedRAMEnergyConsumption: 912,
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
				})
			})
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_PROJECT_REPORT)
		})

		test('toBuffer', () => {
			const bufferString = instance.toBuffer().toString('hex')
			if (UPDATE_TEST_REPORTS && title === 'instance related') {
				PermissionHelper.writeFileWithUserPermission(
					CURRENT_DIR.join('assets', 'ProjectReport', 'instance.buffer').toPlatformString(),
					bufferString
				)
			}

			expect(bufferString).toEqual(EXAMPLE_PROJECT_REPORT_BUFFER)
		})

		test('hash', () => {
			const hashString = instance.hash()
			if (UPDATE_TEST_REPORTS && title === 'instance related') {
				PermissionHelper.writeFileWithUserPermission(
					CURRENT_DIR.join('assets', 'ProjectReport', 'instance.hash').toPlatformString(),
					hashString
				)
			}
			expect(hashString).toBe(EXAMPLE_PROJECT_REPORT_HASH)
		})

		test('storeToFile', () => {
			const projectReportFilePath = CURRENT_DIR.join('..', '..', '..', '..', 'profiles', 'test-profile', 'test-report.oak')
			if (fs.existsSync(projectReportFilePath.dirName().toPlatformString())) {
				fs.rmSync(projectReportFilePath.dirName().toPlatformString(), {
					recursive: true
				})
			}

			instance.relativeRootDir = undefined
			instance.storeToFile(projectReportFilePath, 'json')

			const config = ProfilerConfig.autoResolve()

			expect(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				instance.relativeRootDir!.toString()
			).toBe(
				projectReportFilePath.dirName().pathTo(config.getRootDir()).toString()
			)
			expect(fs.existsSync(projectReportFilePath.toString())).toBeTruthy()
		})

		describe('trackUncommittedFiles', () => {
			test('no git repository', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(null)
				instance.trackUncommittedFiles(
					new UnifiedPath('./'),
					new ExternalResourceHelper(ROOT_DIR)
				)
				expect(instance.executionDetails.uncommittedChanges).toBe(undefined)

				uncommittedFiles_mock.mockRestore()
			})

			test('no uncommitted changes exist', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue([])
				instance.trackUncommittedFiles(
					new UnifiedPath('./'),
					new ExternalResourceHelper(ROOT_DIR)
				)
				expect(instance.executionDetails.uncommittedChanges).toBe(false)

				uncommittedFiles_mock.mockRestore()
			})

			test('uncommitted changes exist', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(['./dist/test.js'])
				instance.trackUncommittedFiles(
					new UnifiedPath('./'),
					new ExternalResourceHelper(ROOT_DIR)
				)
				expect(instance.executionDetails.uncommittedChanges).toBe(true)

				uncommittedFiles_mock.mockRestore()
			})

			test('uncommitted changes exist in node modules has no effect', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(['./node_modules/@oaklean/profiler-core/test.js'])
				instance.trackUncommittedFiles(
					new UnifiedPath('./'),
					new ExternalResourceHelper(ROOT_DIR)
				)
				expect(instance.executionDetails.uncommittedChanges).toBe(false)

				uncommittedFiles_mock.mockRestore()
			})
		})
	})
}

describe('ProjectReport', () => {
	runInstanceTests('instance related', () => {
		const nodeModule = new NodeModule(
			'@oaklean/profiler-core',
			'0.0.4',
		)

		const instance = new ProjectReport({
			origin: ProjectReportOrigin.pure,
			commitHash: '9828760b10d33c0fd06ed12cd6b6edf9fc4d6db0' as GitHash_string,
			commitTimestamp: 1687845481077,
			timestamp: 1687845481077,
			uncommittedChanges: false,
			systemInformation: EXAMPLE_SYSTEM_INFORMATION,
			languageInformation: {
				name: 'node',
				version: '20.11.1'
			},
			runTimeOptions: {
				seeds: {
					'Math.random': '0'
				},
				v8: {
					cpu: {
						sampleInterval: 1 as MicroSeconds_number
					}
				},
				sensorInterface: {
					type: SensorInterfaceType.powermetrics,
					options: {
						sampleInterval: 1000 as MicroSeconds_number,
						outputFilePath: '<anonymized>'
					}
				}
			}
		},
		ReportKind.measurement,
		{
			projectID: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' as ProjectIdentifier_string
		})
		instance.relativeRootDir = new UnifiedPath('./')

		const firstNode = instance.addSensorValuesToIntern(
			new UnifiedPath('./dist/test.js').toString(), // path does not exist in reality 
			'{root}.{class:Class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string,
			{
				cpuTime: {
					selfCPUTime: 20 as MicroSeconds_number,
					aggregatedCPUTime: 30 as MicroSeconds_number
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 40 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 60 as MilliJoule_number
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 40 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 60 as MilliJoule_number
				}
			}
		)
		firstNode.addSensorValuesToLangInternal(
			new GlobalIdentifier(
				'' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string
			),
			{
				cpuTime: {
					selfCPUTime: 0 as MicroSeconds_number,
					aggregatedCPUTime: 10 as MicroSeconds_number
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 0 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 20 as MilliJoule_number
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 0 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 20 as MilliJoule_number
				}
			}
		)
		const secondNode = instance.addSensorValuesToIntern(
			new UnifiedPath('./dist/test.js').toString(), // path does not exist in reality 
			'{root}.{class:Class}.{method:method2}' as SourceNodeIdentifier_string,
			{
				cpuTime: {
					selfCPUTime: 30 as MicroSeconds_number,
					aggregatedCPUTime: 60 as MicroSeconds_number,
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 60 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 120 as MilliJoule_number,
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 60 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 120 as MilliJoule_number,
				}
			}
		)
		secondNode.addSensorValuesToLangInternal(
			new GlobalIdentifier(
				'' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string
			),
			{
				cpuTime: {
					selfCPUTime: 0 as MicroSeconds_number,
					aggregatedCPUTime: 30 as MicroSeconds_number
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 0 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 60 as MilliJoule_number,
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 0 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 60 as MilliJoule_number
				}
			}
		)

		instance.addSensorValuesToExtern(
			new UnifiedPath('./test.js'), // path does not exist in reality 
			nodeModule, // points to the profiler core package itself
			'{root}.{class:Package}.{method:method}' as SourceNodeIdentifier_string,
			{
				cpuTime: {
					selfCPUTime: 10 as MicroSeconds_number,
					aggregatedCPUTime: 10 as MicroSeconds_number,
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 20 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 20 as MilliJoule_number,
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 20 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 20 as MilliJoule_number
				}
			}
		)
		instance.addSensorValuesToExtern(
			new UnifiedPath('./test.js'), // path does not exist in reality 
			nodeModule, // points to the profiler core package itself
			'{root}.{class:Package}.{method:method2}' as SourceNodeIdentifier_string,
			{
				cpuTime: {
					selfCPUTime: 80 as MicroSeconds_number,
					aggregatedCPUTime: 80 as MicroSeconds_number,
				},
				cpuEnergyConsumption: {
					selfCPUEnergyConsumption: 160 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 160 as MilliJoule_number,
				},
				ramEnergyConsumption: {
					selfRAMEnergyConsumption: 160 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 160 as MilliJoule_number
				}
			}
		)
		return instance
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const reportFromString = ProjectReport.fromJSON(JSON.stringify(EXAMPLE_PROJECT_REPORT))
			expect(reportFromString.toJSON()).toEqual(EXAMPLE_PROJECT_REPORT)
		})

		test('deserialization from object', () => {
			const reportFromObject = ProjectReport.fromJSON(EXAMPLE_PROJECT_REPORT)
			expect(reportFromObject.toJSON()).toEqual(EXAMPLE_PROJECT_REPORT)
		})

		runInstanceTests('deserialized instance related', () => {
			const reportFromString = ProjectReport.fromJSON(JSON.stringify(EXAMPLE_PROJECT_REPORT))
			return reportFromString
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_PROJECT_REPORT_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = ProjectReport.consumeFromBuffer(buffer)
			expect(instance.toJSON()).toEqual(EXAMPLE_PROJECT_REPORT)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = ProjectReport.consumeFromBuffer(buffer)
			return instance
		})
	})

	describe('loading from File', () => {
		test('loadFromFile: existing path', () => {
			const filePathJson = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.json')
			const projectReportJson = ProjectReport.loadFromFile(filePathJson, 'json')
			expect(projectReportJson).toBeDefined()

			const filePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.bin')
			const projectReportBin = ProjectReport.loadFromFile(filePathBin, 'bin')
			expect(projectReportBin).toBeDefined()

			expect(projectReportJson?.toJSON()).toEqual(projectReportBin?.toJSON())
		})

		test('loadFromFile: non existing path', () => {
			const filePathJson = CURRENT_DIR.join('report.oak')
			const projectReportJson = ProjectReport.loadFromFile(filePathJson, 'json')
			expect(projectReportJson).toBeUndefined()

			const filePathBin = CURRENT_DIR.join('report.oak')
			const projectReportBin = ProjectReport.loadFromFile(filePathBin, 'bin')
			expect(projectReportBin).toBeUndefined()
		})
	})

	describe('versionFromBinFile', () => {
		test('version is correct without fully loading the report', () => {
			const filePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.bin')
			const projectReportBin = ProjectReport.loadFromFile(filePathBin, 'bin')

			expect(ProjectReport.versionFromBinFile(filePathBin)).toEqual(projectReportBin?.reportVersion)
		})

		test('version is undefined if file does not exist', () => {
			const filePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'exampleX.bin.oak')
			expect(ProjectReport.versionFromBinFile(filePathBin)).toBe(undefined)
		})
	})

	describe('hashFromBinFile', () => {
		test('hash is correct without loading the report', () => {
			const filePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.bin')
			const projectReportBin = ProjectReport.loadFromFile(filePathBin, 'bin')

			expect(ProjectReport.hashFromBinFile(filePathBin)).toEqual(projectReportBin?.hash())
		})

		test('hash is undefined if file does not exist', () => {
			const filePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'exampleX.bin.oak')
			expect(ProjectReport.hashFromBinFile(filePathBin)).toBe(undefined)
		})
	})

	describe('insertCPUProfile', () => {
		test('test case example001', async () => {
			const cpuProfileFilePath = CURRENT_DIR.join('assets', 'CPUProfiles', 'example001.cpuprofile').toString()
			const externalResourceHelper = ExternalResourceHelper.loadFromFile(
				ROOT_DIR,
				EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE001
			)!

			const profile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
			const projectReport = new ProjectReport({
				origin: ProjectReportOrigin.pure,
				commitHash: 'fbf6d5e68ab540636f6929b8cb90b9b1d280efb1' as GitHash_string,
				commitTimestamp: 1706554909143,
				timestamp: 1706554909143,
				uncommittedChanges: true,
				highResolutionBeginTime: '887518894424000',
				systemInformation: EXAMPLE_SYSTEM_INFORMATION,
				languageInformation: {
					name: 'node',
					version: '20.11.1'
				},
				runTimeOptions: {
					seeds: {
						'Math.random': '0'
					},
					v8: {
						cpu: {
							sampleInterval: 1 as MicroSeconds_number
						}
					},
					sensorInterface: {
						type: SensorInterfaceType.powermetrics,
						options: {
							sampleInterval: 1000 as MicroSeconds_number,
							outputFilePath: '<anonymized>'
						}
					}
				}
			}, ReportKind.measurement)
			await projectReport.insertCPUProfile(ROOT_DIR, profile, externalResourceHelper)
			projectReport.normalize()
			projectReport.relativeRootDir = new UnifiedPath('../../../../../../')

			const expectedProjectReportFilePathJson = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.json')
			const expectedProjectReportFilePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.bin')
			if (UPDATE_TEST_REPORTS) {
				projectReport.storeToFile(expectedProjectReportFilePathJson, 'json')
				projectReport.storeToFile(expectedProjectReportFilePathBin, 'bin')
			}

			const expectedJson = ProjectReport.loadFromFile(expectedProjectReportFilePathJson, 'json')
			if (expectedJson) {
				expectedJson.executionDetails.systemInformation = EXAMPLE_SYSTEM_INFORMATION
				expectedJson.executionDetails.highResolutionBeginTime = '887518894424000'
			}

			expect(
				projectReport.toJSON()
			).toEqual(
				expectedJson?.toJSON()
			)

			const expectedBin = ProjectReport.loadFromFile(expectedProjectReportFilePathBin, 'bin')
			if (expectedBin) {
				expectedBin.executionDetails.systemInformation = EXAMPLE_SYSTEM_INFORMATION
				expectedBin.executionDetails.highResolutionBeginTime = '887518894424000'
			}

			expect(
				projectReport.toJSON()
			).toEqual(
				expectedBin?.toJSON()
			)
		})

		test('test case example002', async () => {
			const cpuProfileFilePath = CURRENT_DIR.join('assets', 'CPUProfiles', 'example002.cpuprofile').toString()
			const externalResourceHelper = ExternalResourceHelper.loadFromFile(
				ROOT_DIR,
				EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE002
			)!

			const profile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
			const projectReport = new ProjectReport({
				origin: ProjectReportOrigin.pure,
				commitHash: 'fbf6d5e68ab540636f6929b8cb90b9b1d280efb1' as GitHash_string,
				commitTimestamp: 1706556938476,
				timestamp: 1706556938476,
				uncommittedChanges: true,
				highResolutionBeginTime: '889548167236000',
				systemInformation: EXAMPLE_SYSTEM_INFORMATION,
				languageInformation: {
					name: 'node',
					version: '20.11.1'
				},
				runTimeOptions: {
					seeds: {
						'Math.random': '0'
					},
					v8: {
						cpu: {
							sampleInterval: 1 as MicroSeconds_number
						}
					},
					sensorInterface: {
						type: SensorInterfaceType.powermetrics,
						options: {
							sampleInterval: 1000 as MicroSeconds_number,
							outputFilePath: '<anonymized>'
						}
					}
				}
			}, ReportKind.measurement)
			await projectReport.insertCPUProfile(ROOT_DIR, profile, externalResourceHelper)
			projectReport.relativeRootDir = new UnifiedPath('../../../../../../')
			projectReport.normalize()
			const expectedProjectReportFilePathJson = CURRENT_DIR.join('assets', 'ProjectReport', 'example002.oak.json')
			const expectedProjectReportFilePathBin = CURRENT_DIR.join('assets', 'ProjectReport', 'example002.oak.bin')
			if (UPDATE_TEST_REPORTS) {
				projectReport.storeToFile(expectedProjectReportFilePathJson, 'json')
				projectReport.storeToFile(expectedProjectReportFilePathBin, 'bin')
			}

			const expectedJson = ProjectReport.loadFromFile(expectedProjectReportFilePathJson, 'json')
			if (expectedJson) {
				expectedJson.executionDetails.systemInformation = EXAMPLE_SYSTEM_INFORMATION
				expectedJson.executionDetails.highResolutionBeginTime = '889548167236000'
			}

			expect(
				projectReport.toJSON()
			).toEqual(
				expectedJson?.toJSON()
			)

			const expectedBin = ProjectReport.loadFromFile(expectedProjectReportFilePathBin, 'bin')
			if (expectedBin) {
				expectedBin.executionDetails.systemInformation = EXAMPLE_SYSTEM_INFORMATION
				expectedBin.executionDetails.highResolutionBeginTime = '889548167236000'
			}

			expect(
				projectReport.toJSON()
			).toEqual(
				expectedBin?.toJSON()
			)
		})

		test('not existing Sourcefile', async () => {
			const cpuProfileFilePath = CURRENT_DIR.join('assets', 'CPUProfiles', 'example001.cpuprofile').toString()
			const externalResourceHelper = ExternalResourceHelper.loadFromFile(
				ROOT_DIR,
				EXTERNAL_RESOURCE_HELPER_FILE_PATH_EXAMPLE001
			)!

			const profile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
			const projectReport = new ProjectReport({
				origin: ProjectReportOrigin.pure,
				commitHash: '9828760b10d33c0fd06ed12cd6b6edf9fc4d6db0' as GitHash_string,
				commitTimestamp: 1687845481077,
				timestamp: 1687845481077,
				uncommittedChanges: false,
				highResolutionBeginTime: '2345442642551333',
				systemInformation: EXAMPLE_SYSTEM_INFORMATION,
				languageInformation: {
					name: 'node',
					version: '20.11.1'
				},
				runTimeOptions: {
					seeds: {
						'Math.random': '0'
					},
					v8: {
						cpu: {
							sampleInterval: 1 as MicroSeconds_number
						}
					},
					sensorInterface: {
						type: SensorInterfaceType.powermetrics,
						options: {
							sampleInterval: 1000 as MicroSeconds_number,
							outputFilePath: '<anonymized>'
						}
					}
				}
			}, ReportKind.measurement)

			// change the source file path to a not existing one
			profile['nodes'][3]['callFrame']['url'] = 'not/found/sourcefile.ts'
			await projectReport.insertCPUProfile(ROOT_DIR, profile, externalResourceHelper)

			// a not existing source file should still be added to the project report
			const notFoundModuleIndex = projectReport.globalIndex.getModuleIndex('get')
			const missingFilePathIndex = notFoundModuleIndex?.getFilePathIndex('get', './not/found/sourcefile.ts' as UnifiedPath_string)

			expect(notFoundModuleIndex).toBeDefined()
			expect(missingFilePathIndex).toBeDefined()

			const sourceFileMetaData = projectReport.intern.
				get(missingFilePathIndex?.id as PathID_number)

			expect(sourceFileMetaData).toBeDefined()
		})
	})

	describe('merging', () => {
		let instancesToMerge: ProjectReport[] = []

		beforeEach(() => {
			const first = ProjectReport.loadFromFile(CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.json'), 'json')

			const second = ProjectReport.loadFromFile(CURRENT_DIR.join('assets', 'ProjectReport', 'example002.oak.json'), 'json')

			if (first === undefined || second === undefined) {
				throw new Error('ProjectReport.test.merging: not all instances are defined')
			}

			instancesToMerge = [first, second]
		})

		test('empty arguments', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')

			const t = () => {
				ProjectReport.merge(moduleIndex, ...[])
			}

			expect(t).toThrowError('ProjectReport.merge: no ProjectReports were given')
		})

		test('wrong versions', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			instancesToMerge[0].reportVersion = '1.2.3'

			const t = () => {
				ProjectReport.merge(moduleIndex, ...instancesToMerge)
			}

			expect(t).toThrowError('ProjectReport.merge: Project reports versions are not compatible')
		})

		test('wrong commit hashes', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			instancesToMerge[0].executionDetails.commitHash = '2ce504157fbf340c78a1ea93412773f45b73f516' as GitHash_string

			const t = () => {
				ProjectReport.merge(moduleIndex, ...instancesToMerge)
			}

			expect(t).toThrowError('ProjectReport.merge: Project reports commit hashs are not the same')
		})

		test('merges correctly', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			const expectedPathJson = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.json')
			const expectedPathBin = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.bin')
			const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
			mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

			if (UPDATE_TEST_REPORTS) {
				mergedProjectReport.storeToFile(expectedPathJson, 'json')
				mergedProjectReport.storeToFile(expectedPathBin, 'bin')
			}

			const expectedProjectReportJson = ProjectReport.loadFromFile(expectedPathJson, 'json')
			const expectedProjectReportBin = ProjectReport.loadFromFile(expectedPathBin, 'bin')

			expect(mergedProjectReport.toJSON()).toEqual(
				expectedProjectReportJson?.toJSON()
			)

			expect(mergedProjectReport.toJSON()).toEqual(
				expectedProjectReportBin?.toJSON()
			)
		})

		test('merges correctly with cucc changes', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			const expectedPathJson = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.json')
			const expectedPathBin = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.bin')
			
			// add cucc changes
			const sourceFileIndex_001 = instancesToMerge[0].globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example001.ts').toString())
			expect(sourceFileIndex_001).toBeDefined()
			if (sourceFileIndex_001) {
				sourceFileIndex_001.containsUncommittedChanges = true
			}

			// add cucc changes
			const sourceFileIndex_002 = instancesToMerge[1].globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example002.ts').toString())
			expect(sourceFileIndex_002).toBeDefined()
			if (sourceFileIndex_002) {
				sourceFileIndex_002.containsUncommittedChanges = true
			}
			
			const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)

			mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

			const expectedProjectReportJson = ProjectReport.loadFromFile(expectedPathJson, 'json')
			const expectedProjectReportBin = ProjectReport.loadFromFile(expectedPathBin, 'bin')

			expect(expectedProjectReportJson).toBeDefined()
			expect(expectedProjectReportBin).toBeDefined()
			if (expectedProjectReportJson && expectedProjectReportBin) {
				// add cucc changes to expected json report
				const sourceFileIndex_001_Json = expectedProjectReportJson.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example001.ts').toString())
				expect(sourceFileIndex_001_Json).toBeDefined()
				if (sourceFileIndex_001_Json) {
					sourceFileIndex_001_Json.containsUncommittedChanges = true
				}
				const sourceFileIndex_002_Json = expectedProjectReportJson.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example002.ts').toString())
				expect(sourceFileIndex_002_Json).toBeDefined()
				if (sourceFileIndex_002_Json) {
					sourceFileIndex_002_Json.containsUncommittedChanges = true
				}

				// add cucc changes to expected bin report
				const sourceFileIndex_001_Bin = expectedProjectReportBin.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example001.ts').toString())
				expect(sourceFileIndex_001_Bin).toBeDefined()
				if (sourceFileIndex_001_Bin) {
					sourceFileIndex_001_Bin.containsUncommittedChanges = true
				}
				const sourceFileIndex_002_Bin = expectedProjectReportBin.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/examples/example002.ts').toString())
				expect(sourceFileIndex_002_Bin).toBeDefined()
				if (sourceFileIndex_002_Bin) {
					sourceFileIndex_002_Bin.containsUncommittedChanges = true
				}
			}

			expect(mergedProjectReport.toJSON()).toEqual(
				expectedProjectReportJson?.toJSON()
			)

			expect(mergedProjectReport.toJSON()).toEqual(
				expectedProjectReportBin?.toJSON()
			)
		})

		describe('merges correctly with noisy systemInformation', () => {
			test('first report is different', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const moduleIndex = globalIndex.getModuleIndex('upsert')
				const expectedPath = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.json')
				const expectedProjectReport = ProjectReport.loadFromFile(expectedPath, 'json')
				instancesToMerge[0].executionDetails.systemInformation.memory.free = 0

				if (expectedProjectReport) {
					expectedProjectReport.executionDetails.systemInformation.memory.free = 0
				}

				const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
				mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

				expect(mergedProjectReport.toJSON()).toEqual(
					expectedProjectReport?.toJSON()
				)
			})
			test('seconds report is different', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const moduleIndex = globalIndex.getModuleIndex('upsert')
				const expectedPath = CURRENT_DIR.join('assets', 'ProjectReport', '001&002.merged.oak.json')
				const expectedProjectReport = ProjectReport.loadFromFile(expectedPath, 'json')
				instancesToMerge[1].executionDetails.systemInformation.memory.free = 0

				const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
				mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

				expect(mergedProjectReport.toJSON()).toEqual(
					expectedProjectReport?.toJSON()
				)
			})
		})

		test('does not merge with different systems', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			const consoleError = jest.spyOn(LoggerHelper, 'error').mockImplementation(() => undefined)
			instancesToMerge[0].executionDetails.systemInformation.cpu.manufacturer = 'abc'

			const t = () => {
				ProjectReport.merge(moduleIndex, ...instancesToMerge)
			}
			expect(t).toThrow('ProjectReport.merge: cannot merge ProjectReports from different systems')

			expect(consoleError).toBeCalledWith('SystemInformation.isSame: detected different cpus')
			consoleError.mockRestore()
		})

		describe('merges uncommitted changes correctly', () => {
			test('default has no uncommitted changes', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const moduleIndex = globalIndex.getModuleIndex('upsert')
				instancesToMerge[0].executionDetails.uncommittedChanges = false
				instancesToMerge[1].executionDetails.uncommittedChanges = false

				const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
				mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

				expect(mergedProjectReport.executionDetails.uncommittedChanges).toEqual(false)
			})

			test('first report has uncommitted changes', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const moduleIndex = globalIndex.getModuleIndex('upsert')
				instancesToMerge[0].executionDetails.uncommittedChanges = true

				const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
				mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

				expect(mergedProjectReport.executionDetails.uncommittedChanges).toEqual(true)
			})

			test('second report has uncommitted changes', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const moduleIndex = globalIndex.getModuleIndex('upsert')
				instancesToMerge[1].executionDetails.uncommittedChanges = true

				const mergedProjectReport = ProjectReport.merge(moduleIndex, ...instancesToMerge)
				mergedProjectReport.relativeRootDir = new UnifiedPath('../../../..')

				expect(mergedProjectReport.executionDetails.uncommittedChanges).toEqual(true)
			})
		})
	})

	describe('shouldBeStoredInRegistry', () => {
		test('test with pure measurement', async () => {
			const projectReport = new ProjectReport({
				...EXAMPLE_EXECUTION_DETAILS,
				origin: ProjectReportOrigin.pure
			}, ReportKind.measurement)
			expect(await projectReport.shouldBeStoredInRegistry()).toBe(true)
		})

		test('test jest accumulated measurement', async () => {
			const projectReport = new ProjectReport({
				...EXAMPLE_EXECUTION_DETAILS,
				origin: ProjectReportOrigin.pure
			}, ReportKind.accumulated)
			expect(await projectReport.shouldBeStoredInRegistry()).toBe(true)
		})

		test('test non accumulated jest measurement', async () => {
			const projectReport = new ProjectReport({
				...EXAMPLE_EXECUTION_DETAILS,
				origin: ProjectReportOrigin.jestEnv
			}, ReportKind.measurement)
			expect(await projectReport.shouldBeStoredInRegistry()).toBe(false)
		})

		test('test accumulated jest measurement', async () => {
			const projectReport = new ProjectReport({
				...EXAMPLE_EXECUTION_DETAILS,
				origin: ProjectReportOrigin.jestEnv
			}, ReportKind.accumulated)
			expect(await projectReport.shouldBeStoredInRegistry()).toBe(true)
		})
	})
})
