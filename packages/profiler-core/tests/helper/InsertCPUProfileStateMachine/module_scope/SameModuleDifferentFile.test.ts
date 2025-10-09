// Types
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
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

describe('InsertCPUProfileStateMachine.insertCPUNodes (MODULE_SCOPE + SAME MODULE + DIFFERENT FILES)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('mA.A0 -> mA.B0 -> mA.C0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileC-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 60,
									internCPUTime: 30
								},
								intern: {
									'5': {
										id: 5,
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
					},
					'4': {
						path: './fileB.js',
						functions: {
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 30,
									internCPUTime: 10
								},
								intern: {
									'7': {
										id: 7,
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
					},
					'6': {
						path: './fileC.js',
						functions: {
							'7': {
								id: 7,
								type: SourceNodeMetaDataType.SourceNode,
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
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})

	test('mA.A0 -> mA.B0 -> mA.A0 -> mA.B0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 100,
									internCPUTime: 60
								},
								intern: {
									'5': {
										id: 5,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 4,
											selfCPUTime: 40,
											aggregatedCPUTime: 60
										}
									}
								}
							}
						}
					},
					'4': {
						path: './fileB.js',
						functions: {
							'5': {
								id: 5,
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
							}
						}
					}
				}
			}
		})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})
})
