import * as fs from 'fs'

import { UnifiedPath } from '../../src/system/UnifiedPath'
import { ProjectReport } from '../../src/model/ProjectReport'
import type { ICpuProfileRaw } from '../../lib/vscode-js-profile-core/src/cpu/types'
import { NodeModule } from '../../src/model/NodeModule'
import { VERSION } from '../../src/constants/app'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'
import { GitHelper } from '../../src/helper/GitHelper'
import { ProfilerConfig } from '../../src/model/ProfilerConfig'
import { GlobalIndex } from '../../src/model/index/GlobalIndex'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import { PermissionHelper } from '../../src/helper/PermissionHelper'
import { LoggerHelper } from '../../src'
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
		currentId: 12,
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
					},
					src: {
						children: {
							'test.ts': {
								id: 7 as PathID_number
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
				id: 8 as ModuleID_number,
				children: {
					'test.js': {
						id: 9 as PathID_number,
						file: {
							'{root}': {
								children: {
									'{class:Package}': {
										children: {
											'{method:method}': {
												id: 10 as SourceNodeID_number
											},
											'{method:method2}': {
												id: 11 as SourceNodeID_number
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
	internMapping: {
		7: 1
	} as Record<PathID_number, PathID_number>,
	intern: {
		[1 as PathID_number]: {
			path: './dist/test.js' as UnifiedPath_string,
			functions: {
				[2 as SourceNodeID_number]: {
					id: 2 as SourceNodeID_number,
					type: SourceNodeMetaDataType.SourceNode,
					sensorValues: {
						profilerHits: 1,

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
								profilerHits: 1,
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
						profilerHits: 1,

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
								profilerHits: 1,

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
		[8 as ModuleID_number]: {
			reportVersion: VERSION,
			kind: ReportKind.measurement,
			nodeModule: {
				name: '@oaklean/profiler-core',
				version: '0.0.4',
			},
			lang_internalHeadlessSensorValues: {},
			intern: {
				[9 as PathID_number]: {
					path: './test.js' as UnifiedPath_string,
					functions: {
						[10 as SourceNodeID_number]: {
							id: 10 as SourceNodeID_number,
							type: SourceNodeMetaDataType.SourceNode,
							sensorValues: {
								profilerHits: 1,

								selfCPUTime: 10,
								aggregatedCPUTime: 10,

								selfCPUEnergyConsumption: 20,
								aggregatedCPUEnergyConsumption: 20,

								selfRAMEnergyConsumption: 20,
								aggregatedRAMEnergyConsumption: 20
							} as ISensorValues
						} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
						[11 as SourceNodeID_number]: {
							id: 11 as SourceNodeID_number,
							type: SourceNodeMetaDataType.SourceNode,
							sensorValues: {
								profilerHits: 1,

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


function setProfilesContext(profile: ICpuProfileRaw) {
	for (const node of profile.nodes) {
		if (node.callFrame.url !== '' && !node.callFrame.url.startsWith('node:')) {
			node.callFrame.url = CURRENT_DIR.join('..', '..', '..', '..', node.callFrame.url).toString()
		}
	}
}

function runInstanceTests(title: string, preDefinedInstance: () => ProjectReport) {
	describe(title, () => {
		let instance: ProjectReport

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof ProjectReport', () => {
			expect(instance instanceof ProjectReport).toBeTruthy()
		})

		it('should have a method removeFromIntern()', () => {
			expect(instance.removeFromIntern).toBeTruthy()
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

		it('should have a method addSourceFileMapLink()', () => {
			expect(instance.addSourceFileMapLink).toBeTruthy()
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

		test('reversedInternMapping', () => {
			expect(instance.reversedInternMapping.toJSON()).toEqual({
				1: 7
			})
		})

		test('engineModule', () => {
			const engineModule = instance.engineModule
			expect(engineModule.toJSON()).toEqual({
				name: 'node',
				version: '20.11.1'
			})
		})

		describe('addSourceFileMapLink', () => {
			test('non existing compiled file path', () => {
				const t = () => {
					instance.addSourceFileMapLink(
						new UnifiedPath('abc'),
						new UnifiedPath('xyz'),
					)
				}

				expect(t).toThrowError('addSourceFileMapLink: The compiled file target does not exist (./abc)')
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
						selfCPUTime: 111 as MicroSeconds_number,
						aggregatedCPUTime: 222 as MicroSeconds_number
					},
					cpuEnergyConsumption: {
						selfCPUEnergyConsumption: 222 as MilliJoule_number,
						aggregatedCPUEnergyConsumption: 444 as MilliJoule_number
					},
					ramEnergyConsumption: {
						selfRAMEnergyConsumption: 222 as MilliJoule_number,
						aggregatedRAMEnergyConsumption: 444 as MilliJoule_number
					}
				}
			)
			const moduleID = instance.globalIndex.getModuleIndex('get', nodeModule.identifier)?.id as ModuleID_number

			expect(instance.extern.get(moduleID)?.getMetaDataFromFile(
				new UnifiedPath('./report.oak'),
				new UnifiedPath('./file')
			)?.functions.toJSON()).toEqual({
				14: {
					type: SourceNodeMetaDataType.SourceNode,
					id: 14,
					sensorValues: {
						profilerHits: 1,

						selfCPUTime: 111,
						aggregatedCPUTime: 222,

						selfCPUEnergyConsumption: 222,
						aggregatedCPUEnergyConsumption: 444,

						selfRAMEnergyConsumption: 222,
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
							profilerHits: 1,

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
									profilerHits: 1,

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
							profilerHits: 1,

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
									profilerHits: 1,

									aggregatedCPUTime: 30,

									aggregatedCPUEnergyConsumption: 60,

									aggregatedRAMEnergyConsumption: 60
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
				})
			})

			test('mapped paths', () => {
				expect(instance.getMetaDataFromFile(
					new UnifiedPath('./report.oak'),
					new UnifiedPath('./src/test.ts')
				)?.functions.toJSON()).toEqual({
					2: {
						id: 2 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,

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
									profilerHits: 1,

									aggregatedCPUTime: 10,

									aggregatedCPUEnergyConsumption: 20,

									aggregatedRAMEnergyConsumption: 20,
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					6: {
						id: 6 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,

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
									profilerHits: 1,

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
							selfCPUTime: 123 as MicroSeconds_number,
							aggregatedCPUTime: 456 as MicroSeconds_number
						},
						cpuEnergyConsumption: {
							selfCPUEnergyConsumption: 246 as MilliJoule_number,
							aggregatedCPUEnergyConsumption: 912 as MilliJoule_number
						},
						ramEnergyConsumption: {
							selfRAMEnergyConsumption: 246 as MilliJoule_number,
							aggregatedRAMEnergyConsumption: 912 as MilliJoule_number
						}
					}
				)
				instance.relativeRootDir = undefined
				expect(instance.getMetaDataFromFile(
					new UnifiedPath('./report.oak'),
					new UnifiedPath('/abs/path/to/file')
				)?.functions.toJSON()).toEqual({
					13: {
						id: 13 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 123,
							aggregatedCPUTime: 456,

							selfCPUEnergyConsumption: 246,
							aggregatedCPUEnergyConsumption: 912,

							selfRAMEnergyConsumption: 246,
							aggregatedRAMEnergyConsumption: 912,
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
				})
			})

			test('mapped absolute paths', () => {
				instance.addSensorValuesToIntern(
					new UnifiedPath('/abs/path/to/file').toString(),
					'{root}{class:Class}.{method:method}' as SourceNodeIdentifier_string,
					{
						cpuTime: {
							selfCPUTime: 123 as MicroSeconds_number,
							aggregatedCPUTime: 456 as MicroSeconds_number
						},
						cpuEnergyConsumption: {
							selfCPUEnergyConsumption: 246 as MilliJoule_number,
							aggregatedCPUEnergyConsumption: 912 as MilliJoule_number
						},
						ramEnergyConsumption: {
							selfRAMEnergyConsumption: 246 as MilliJoule_number,
							aggregatedRAMEnergyConsumption: 912 as MilliJoule_number
						}
					}
				)
				instance.addSourceFileMapLink(
					new UnifiedPath('/abs/path/to/file'),
					new UnifiedPath('/abs/path/to/file.ts')
				)
				instance.relativeRootDir = undefined
				expect(instance.getMetaDataFromFile(
					new UnifiedPath('./report.oak'),
					new UnifiedPath('/abs/path/to/file.ts')
				)?.functions.toJSON()).toEqual({
					13: {
						id: 13 as SourceNodeID_number,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 123,
							aggregatedCPUTime: 456,

							selfCPUEnergyConsumption: 246,
							aggregatedCPUEnergyConsumption: 912,

							selfRAMEnergyConsumption: 246,
							aggregatedRAMEnergyConsumption: 912
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

		test('removeFromIntern', () => {
			instance.removeFromIntern(new UnifiedPath('./dist/test.js').toString())
			expect(instance.intern.toJSON()).toEqual(undefined)
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
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(undefined)
				instance.trackUncommittedFiles(new UnifiedPath('./'))
				expect(instance.executionDetails.uncommittedChanges).toBe(undefined)

				uncommittedFiles_mock.mockRestore()
			})

			test('no uncommitted changes exist', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue([])
				instance.trackUncommittedFiles(new UnifiedPath('./'))
				expect(instance.executionDetails.uncommittedChanges).toBe(false)

				uncommittedFiles_mock.mockRestore()
			})

			test('uncommitted changes exist', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(['./dist/test.js'])
				instance.trackUncommittedFiles(new UnifiedPath('./'))
				expect(instance.executionDetails.uncommittedChanges).toBe(true)

				uncommittedFiles_mock.mockRestore()
			})

			test('uncommitted changes exist in node modules has no effect', () => {
				const uncommittedFiles_mock = jest.spyOn(GitHelper, 'uncommittedFiles').mockReturnValue(['./node_modules/@oaklean/profiler-core/test.js'])
				instance.trackUncommittedFiles(new UnifiedPath('./'))
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
		instance.addSourceFileMapLink(
			new UnifiedPath('./dist/test.js'),
			new UnifiedPath('./src/test.ts')
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
			const profile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
			setProfilesContext(profile)
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
			await projectReport.insertCPUProfile(CURRENT_DIR.join('..', '..', '..', '..'), profile)
			projectReport.removeFromIntern([
				new UnifiedPath('./packages/profiler/dist/src/Profiler.js').toString(),
				new UnifiedPath('./packages/profiler/src/Profiler.ts').toString(),
				new UnifiedPath('./packages/profiler/dist/src/model/V8Profiler.js').toString(),
				new UnifiedPath('./packages/profiler/src/model/V8Profiler.ts').toString()
			])
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
			const profile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
			setProfilesContext(profile)
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
			await projectReport.insertCPUProfile(CURRENT_DIR.join('..', '..', '..', '..'), profile)
			projectReport.relativeRootDir = new UnifiedPath('../../../../../../')
			projectReport.removeFromIntern([
				new UnifiedPath('./packages/profiler/dist/src/Profiler.js').toString(),
				new UnifiedPath('./packages/profiler/src/Profiler.ts').toString(),
				new UnifiedPath('./packages/profiler/dist/src/model/V8Profiler.js').toString(),
				new UnifiedPath('./packages/profiler/src/model/V8Profiler.ts').toString()
			])
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
			const t = async () => {
				await projectReport.insertCPUProfile(CURRENT_DIR.join('..', '..', '..', '..'), profile)
			}

			await expect(t).rejects.toThrowError('Sourcefile does not exist: ./packages/profiler/dist/src/Profiler.js')
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

		test('wrong path mappings', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			instancesToMerge[0].internMapping.set(
				(instancesToMerge[0].globalIndex.getModuleIndex('get')?.getFilePathIndex('upsert', './packages/profiler/examples/example002.ts' as UnifiedPath_string)?.id || -1) as PathID_number,
				(instancesToMerge[0].globalIndex.getModuleIndex('get')?.getFilePathIndex('upsert', './packages/profiler/src/examples/example002.js' as UnifiedPath_string)?.id || -1) as PathID_number)

			const t = () => {
				ProjectReport.merge(moduleIndex, ...instancesToMerge)
			}

			expect(t).toThrowError('ProjectReport.merge: the ProjectReports contain different path mapping')
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
			const sourceFileIndex_001 = instancesToMerge[0].globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example001.js').toString())
			expect(sourceFileIndex_001).toBeDefined()
			if (sourceFileIndex_001) {
				sourceFileIndex_001.containsUncommittedChanges = true
			}

			// add cucc changes
			const sourceFileIndex_002 = instancesToMerge[1].globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example002.js').toString())
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
				const sourceFileIndex_001_Json = expectedProjectReportJson.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example001.js').toString())
				expect(sourceFileIndex_001_Json).toBeDefined()
				if (sourceFileIndex_001_Json) {
					sourceFileIndex_001_Json.containsUncommittedChanges = true
				}
				const sourceFileIndex_002_Json = expectedProjectReportJson.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example002.js').toString())
				expect(sourceFileIndex_002_Json).toBeDefined()
				if (sourceFileIndex_002_Json) {
					sourceFileIndex_002_Json.containsUncommittedChanges = true
				}

				// add cucc changes to expected bin report
				const sourceFileIndex_001_Bin = expectedProjectReportBin.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example001.js').toString())
				expect(sourceFileIndex_001_Bin).toBeDefined()
				if (sourceFileIndex_001_Bin) {
					sourceFileIndex_001_Bin.containsUncommittedChanges = true
				}
				const sourceFileIndex_002_Bin = expectedProjectReportBin.globalIndex.getModuleIndex('get')?.getFilePathIndex('get', new UnifiedPath('./packages/profiler/dist/examples/example002.js').toString())
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
