import {
	ReportKind,
	MicroSeconds_number,
	SourceNodeMetaDataType,
	ProjectReport,
	InsertCPUProfileStateMachine
} from '@oaklean/profiler-core/src'

// Test Assets
import { SOURCE_LOCATIONS_DEFAULT } from '../assets/SourceLocations'
import {
	mockedCPUModel,
	createLocationChainCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

describe('InsertCPUProfileStateMachine.insertCPUNodes (PROJECT_SCOPE + SAME FILE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('A0 -> A1 -> A2', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
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
})
