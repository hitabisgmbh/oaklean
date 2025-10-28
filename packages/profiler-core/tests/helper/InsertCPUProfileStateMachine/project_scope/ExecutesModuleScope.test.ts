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
	createLocationTreeCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

describe('InsertCPUProfileStateMachine.insertCPUNodes (PROJECT_SCOPE executes MODULE_SCOPE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('A0 -> (mA.A0 | mB.A0)', async () => {
		/*
			A0: 10 | 50
			├── mA.A0: 20 | 20
			└── mB.A0: 20 | 20
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel(
				[
					 SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					[
						[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'], []],
						[SOURCE_LOCATIONS_DEFAULT['moduleB-fileA-0'], []]
					]
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toEqual({
			'3': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'4': {
						path: './fileA.js',
						functions: {
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							}
						}
					}
				}
			},
			'6': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleB',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'7': {
						path: './fileA.js',
						functions: {
							'8': {
								id: 8,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							}
						}
					}
				}
			}
		})
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
							externCPUTime: 40
						},
						extern: {
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							},
							'8': {
								id: 8,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							}
						}
					}
				}
			}
		})
	})
})
