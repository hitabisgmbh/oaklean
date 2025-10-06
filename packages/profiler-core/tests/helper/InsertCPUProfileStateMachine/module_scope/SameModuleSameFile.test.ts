// Test Assets
import { SOURCE_LOCATIONS_DEFAULT } from '../assets/SourceLocations'
import {
	mockedCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'
import { InsertCPUProfileStateMachine } from '../../../../src/helper/InsertCPUProfileHelper/InsertCPUProfileStateMachine'
import { ProjectReport } from '../../../../src/model/ProjectReport'
// Types
import {
	ReportKind,
	MicroSeconds_number,
	SourceNodeMetaDataType
} from '../../../../src/types'

describe('InsertCPUProfileStateMachine.insertCPUNodes (MODULE_SCOPE + SAME MODULE + SAME FILE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('mA.A0 -> mA.A1 -> mA.A2', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'],
							profilerHits: 1,
							sensorValues: {
								selfCPUTime: 10 as MicroSeconds_number,
								aggregatedCPUTime: 10 as MicroSeconds_number
							}
						}
					]
				}
			]
		})

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
									'4': {
										id: 4,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 2,
											selfCPUTime: 20,
											aggregatedCPUTime: 30
										}
									}
								}
							},
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 30,
									internCPUTime: 10
								},
								intern: {
									'5': {
										id: 5,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 1,
											selfCPUTime: 10,
											aggregatedCPUTime: 10
										}
									}
								}
							},
							'5': {
								id: 5,
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

	test('mA.A0 -> mA.A0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 2,
			sensorValues: {
				selfCPUTime: 20 as MicroSeconds_number,
				aggregatedCPUTime: 50 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					}
				}
			]
		})

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
									profilerHits: 5,
									selfCPUTime: 50,
									aggregatedCPUTime: 50
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

	test('mA.A0 -> mA.A1 -> mA.A0 -> mA.A1', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 60 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
							profilerHits: 2,
							sensorValues: {
								selfCPUTime: 20 as MicroSeconds_number,
								aggregatedCPUTime: 30 as MicroSeconds_number
							},
							children: [
								{
									location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
									profilerHits: 1,
									sensorValues: {
										selfCPUTime: 10 as MicroSeconds_number,
										aggregatedCPUTime: 10 as MicroSeconds_number
									}
								}
							]
						}
					]
				}
			]
		})

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
									'4': {
										id: 4,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 4,
											selfCPUTime: 40,
											aggregatedCPUTime: 60
										}
									}
								}
							},
							'4': {
								id: 4,
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
