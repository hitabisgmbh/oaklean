import {
	ReportKind,
	SourceNodeMetaDataType,
	ProjectReport,
	InsertCPUProfileStateMachine
} from '@oaklean/profiler-core/src'

// Test Assets
import { SOURCE_LOCATIONS_DEFAULT } from '../assets/SourceLocations'
import {
	mockedCPUModel,
	createLocationChainCPUModel,
	createLocationTreeCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

describe('InsertCPUProfileStateMachine.insertCPUNodes (PROJECT_SCOPE + SAME FILE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(EXAMPLE_EXECUTION_DETAILS, ReportKind.measurement)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('A0 -> A1 -> A2', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-2']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 3,
							selfCPUTime: 30,
							aggregatedCPUTime: 60,
							internCPUTime: 30
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 30
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 30,
							internCPUTime: 10
						},
						intern: {
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 10
								}
							}
						}
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 10
						}
					}
				}
			}
		})
	})

	test('A0 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 3,
							selfCPUTime: 30,
							aggregatedCPUTime: 30
						}
					}
				}
			}
		})
	})

	test('A0 -> A0 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 60
						}
					}
				}
			}
		})
	})

	test('A0 -> A1 -> A1 -> A1', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 100,
							internCPUTime: 60
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 60
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 60
						}
					}
				}
			}
		})
	})

	test('A0 -> A1 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 60,
							internCPUTime: 30
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 30
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 30,
							internCPUTime: 10
						},
						intern: {
							'2': {
								id: 2,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 10
								}
							}
						}
					}
				}
			}
		})
	})

	test('A0 -> A1 -> A0 -> A1', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['project-fileA-1']
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 100,
							internCPUTime: 60
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									selfCPUTime: 40,
									aggregatedCPUTime: 60
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 60,
							internCPUTime: 30
						},
						intern: {
							'2': {
								id: 2,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 30
								}
							}
						}
					}
				}
			}
		})
	})

	// ------ split cases ------

	test('A0 -> (A1 || A2)', async () => {
		/*
			A0: 10 | 50
			├── B0: 20 | 20
			└── C0: 20 | 20
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				[
					[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], []],
					[SOURCE_LOCATIONS_DEFAULT['project-fileA-2'], []]
				]
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 50,
							internCPUTime: 40
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							},
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 20
						}
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 20
						}
					}
				}
			}
		})
	})

	test('A0 -> (A0 -> A0 -> A0 || A0 -> A0 -> A0 || A0 -> A0 -> A0)', async () => {
		/*
			A0: 10 | 280
			├── A0: 20 | 90
			│    └── A0: 30 | 70
			│         └── A0: 40 | 40
			├── A0: 20 | 90
			│    └── A0: 30 | 70
			│         └── A0: 40 | 40
			└── A0: 20 | 90
						└── A0: 30 | 70
								└── A0: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], []]]]]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], []]]]]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], []]]]]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 28,
							selfCPUTime: 280,
							aggregatedCPUTime: 280
						}
					}
				}
			}
		})
	})

	test('A0 -> (A1 -> A1 -> A1 || A2 -> A2 -> A2 || A1 -> A1 -> A1)', async () => {
		/*
			A0: 10 | 280
			├── A1: 20 | 90
			│    └── A1: 30 | 70
			│         └── A1: 40 | 40
			├── A2: 20 | 90
			│    └── A2: 30 | 70
			│         └── A2: 40 | 40
			└── A1: 20 | 90
						└── A1: 30 | 70
								└── A1: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], []]]]]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-2'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-2'], []]]]]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], []]]]]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 280,
							internCPUTime: 270
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									selfCPUTime: 40,
									aggregatedCPUTime: 180
								}
							},
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 90
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 18,
							selfCPUTime: 180,
							aggregatedCPUTime: 180
						}
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 9,
							selfCPUTime: 90,
							aggregatedCPUTime: 90
						}
					}
				}
			}
		})
	})

	test('A0 -> (A1 -> A0 -> A1 || A2 -> A0 -> A2)', async () => {
		/*
			A0: 10 | 190
			├── A1: 20 | 90
			│    └── A0: 30 | 70
			│         └── A1: 40 | 40
			└── A2: 20 | 90
						└── A0: 30 | 70
								└── A2: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-1'], []]]]]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
						[[SOURCE_LOCATIONS_DEFAULT['project-fileA-0'], [[SOURCE_LOCATIONS_DEFAULT['project-fileA-2'], []]]]]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(cpuNode, MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 7,
							selfCPUTime: 70,
							aggregatedCPUTime: 190,
							internCPUTime: 180
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 90
								}
							},
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 90
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 90,
							internCPUTime: 70
						},
						intern: {
							'2': {
								id: 2,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 70
								}
							}
						}
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 90,
							internCPUTime: 70
						},
						intern: {
							'2': {
								id: 2,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 70
								}
							}
						}
					}
				}
			}
		})
	})
})
