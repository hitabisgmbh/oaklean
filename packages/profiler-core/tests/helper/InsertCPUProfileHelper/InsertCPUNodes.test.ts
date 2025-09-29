// Test Assets
import {
	SOURCE_LOCATIONS_DEFAULT,
} from './assets/SourceLocations'
import {
	mockedCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from './mock'

import { EXAMPLE_EXECUTION_DETAILS } from '../../model/assets/ProjectReport/ExecutionDetails'
import {
	InsertCPUProfileStateMachine,
} from '../../../src/helper/InsertCPUProfileHelper/InsertCPUProfileStateMachine'
import { ProjectReport } from '../../../src/model/ProjectReport'
// Types
import {
	ReportKind,
	MicroSeconds_number,
	SourceNodeMetaDataType
} from '../../../src/types'

describe('InsertCPUProfileStateMachine.insertCPUNodes', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('same project-scope cpu-node recursive call', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-index-0'],
			profilerHits: 2,
			sensorValues: {
				selfCPUTime: 20 as MicroSeconds_number,
				aggregatedCPUTime: 50 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-index-0'],
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

		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/index.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 5,
							selfCPUTime: 50,
							aggregatedCPUTime: 50
						}
					} 
				}
			}
		})
	})

	test('different project-scope cpu-node recursive call', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-index-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-index-1'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 60 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['project-index-0'],
							profilerHits: 2,
							sensorValues: {
								selfCPUTime: 20 as MicroSeconds_number,
								aggregatedCPUTime: 30 as MicroSeconds_number
							},
							children: [
								{
									location: SOURCE_LOCATIONS_DEFAULT['project-index-1'],
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

		expect(projectReport.extern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/index.js',
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
