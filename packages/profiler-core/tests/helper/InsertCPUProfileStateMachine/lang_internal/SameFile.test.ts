import {
	ReportKind,
	SourceNodeMetaDataType,
	ProjectReport,
	InsertCPUProfileStateMachine
} from '@oaklean/profiler-core/src'

// Test Assets
import { SOURCE_LOCATIONS_LANG_INTERNAL } from '../assets/SourceLocations'
import {
	mockedCPUModel,
	createLocationChainCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

describe('InsertCPUProfileStateMachine.insertCPUNodes (LANG_INTERNAL + SAME FILE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('LA.0 -> LA.1 -> LA.2', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-2'],
			])
		)

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
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 20,
							aggregatedCPUTime: 30
						}
					},
					'5': {
						id: 5,
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

	test('LA.0 -> LA.0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({
			selfCPUTime: 30
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
							aggregatedCPUTime: 30
						}
					}
				}
			}
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})

	test('LA.0 -> LA.1 -> LA.0 -> LA.1', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
				SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
			])
		)

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
					},
					'4': {
						id: 4,
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
