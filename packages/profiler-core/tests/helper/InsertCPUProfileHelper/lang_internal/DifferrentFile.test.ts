// Test Assets
import { SOURCE_LOCATIONS_LANG_INTERNAL } from '../assets/SourceLocations'
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

describe('InsertCPUProfileStateMachine.insertCPUNodes (LANG_INTERNAL + DIFFERENT FILES)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('LA.0 -> LB.0 -> LC.0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_LANG_INTERNAL['libB-0'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_LANG_INTERNAL['libC-0'],
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

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({
			selfCPUTime: 60
		})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toEqual({
			'2': {
				path: 'libA',
				functions: {
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 3,
							selfCPUTime: 30,
							aggregatedCPUTime: 60
						}
					}
				}
			},
			'4': {
				path: 'libB',
				functions: {
					'5': {
						id: 5,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 30
						}
					}
				}
			},
			'6': {
				path: 'libC',
				functions: {
					'7': {
						id: 7,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 10
						}
					}
				}
			}
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})

	test('LA.0 -> LB.0 -> LA.0 -> LB.0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_LANG_INTERNAL['libB-0'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 60 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
							profilerHits: 2,
							sensorValues: {
								selfCPUTime: 20 as MicroSeconds_number,
								aggregatedCPUTime: 30 as MicroSeconds_number
							},
							children: [
								{
									location: SOURCE_LOCATIONS_LANG_INTERNAL['libB-0'],
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

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({
			selfCPUTime: 100
		})
		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toEqual({
			'2': {
				path: 'libA',
				functions: {
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 6,
							selfCPUTime: 60,
							aggregatedCPUTime: 100
						}
					}
				}
			},
			'4': {
				path: 'libB',
				functions: {
					'5': {
						id: 5,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 60
						}
					}
				}
			}
		})

		expect(projectReport.intern.toJSON()).toBeUndefined()
	})
})
