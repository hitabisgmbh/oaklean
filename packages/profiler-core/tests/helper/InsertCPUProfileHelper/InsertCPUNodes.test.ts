// Test Assets
import {
	SOURCE_LOCATIONS_LANG_INTERNAL,
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-2'],
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			profilerHits: 2,
			sensorValues: {
				selfCPUTime: 20 as MicroSeconds_number,
				aggregatedCPUTime: 50 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
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

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({
			selfCPUTime: 50
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
							profilerHits: 5,
							selfCPUTime: 50,
							aggregatedCPUTime: 50
						}
					} 
				}
			}
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})

	test('LA.0 -> LA.1 -> LA.0 -> LA.1', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
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
									location: SOURCE_LOCATIONS_LANG_INTERNAL['libA-1'],
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
					},
					'4': {
						id: 4,
						type: SourceNodeMetaDataType.LangInternalSourceNode,
						sensorValues: {
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 60
						},
					}
				}
			}
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
	})
})

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
							aggregatedCPUTime: 10,
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
			profilerHits: 2,
			sensorValues: {
				selfCPUTime: 20 as MicroSeconds_number,
				aggregatedCPUTime: 50 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
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
							profilerHits: 5,
							selfCPUTime: 50,
							aggregatedCPUTime: 50
						}
					} 
				}
			}
		})
	})

	test('A0 -> A1 -> A0 -> A1', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 60 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
							profilerHits: 2,
							sensorValues: {
								selfCPUTime: 20 as MicroSeconds_number,
								aggregatedCPUTime: 30 as MicroSeconds_number
							},
							children: [
								{
									location: SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
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

describe('InsertCPUProfileStateMachine.insertCPUNodes (PROJECT_SCOPE + DIFFERENT FILES)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('A0 -> B0 -> C0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileB-0'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['project-fileC-0'],
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
					}
				}
			},
			'3': {
				path: './src/fileB.js',
				functions: {
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
							'6': {
								id: 6,
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
			'5': {
				path: './src/fileC.js',
				functions: {
					'6': {
						id: 6,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 10,
						}
					}
				}
			}
		})
	})

	test('A0 -> B0 -> A0 -> B0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileB-0'],
					profilerHits: 3,
					sensorValues: {
						selfCPUTime: 30 as MicroSeconds_number,
						aggregatedCPUTime: 60 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
							profilerHits: 2,
							sensorValues: {
								selfCPUTime: 20 as MicroSeconds_number,
								aggregatedCPUTime: 30 as MicroSeconds_number
							},
							children: [
								{
									location: SOURCE_LOCATIONS_DEFAULT['project-fileB-0'],
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
				}
			},
			'3': {
				path: './src/fileB.js',
				functions: {
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
					profilerHits: 2,
					sensorValues: {
						selfCPUTime: 20 as MicroSeconds_number,
						aggregatedCPUTime: 30 as MicroSeconds_number
					},
					children: [
						{
							location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileC-0'],
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
									aggregatedCPUTime: 10,
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 4,
			sensorValues: {
				selfCPUTime: 40 as MicroSeconds_number,
				aggregatedCPUTime: 100 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
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
									location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileB-0'],
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
							},
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
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
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
						aggregatedCPUTime: 20 as MicroSeconds_number
					}
				},
				{
					location: SOURCE_LOCATIONS_DEFAULT['moduleB-fileA-0'],
					profilerHits: 1,
					sensorValues: {
						selfCPUTime: 10 as MicroSeconds_number,
						aggregatedCPUTime: 10 as MicroSeconds_number
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
			'3': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
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
				lang_internalHeadlessSensorValues: {},
				intern: {
					'7': {
						path: './fileA.js',
						functions: {
							'8': {
								id: 8,
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
							externCPUTime: 30
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
})

describe('InsertCPUProfileStateMachine.insertCPUNodes (MODULE_SCOPE executes PROJECT_SCOPE)', () => {
	let projectReport: ProjectReport
	let stateMachine: InsertCPUProfileStateMachine

	beforeEach(() => {
		projectReport = new ProjectReport(
			EXAMPLE_EXECUTION_DETAILS,
			ReportKind.measurement
		)
		stateMachine = new InsertCPUProfileStateMachine(projectReport)
	})

	test('mA.A0 -> A0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
			profilerHits: 2,
			sensorValues: {
				selfCPUTime: 20 as MicroSeconds_number,
				aggregatedCPUTime: 30 as MicroSeconds_number
			},
			children: [
				{
					location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					profilerHits: 1,
					sensorValues: {
						selfCPUTime: 10 as MicroSeconds_number,
						aggregatedCPUTime: 10 as MicroSeconds_number
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
			'4': {
				path: './src/fileA.js',
				functions: {
					'5': {
						id: 5,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 10,
						}
					}
				}
			}
		})
	})

	test('A1 -> mA.A0 -> A0', async () => {
		const cpuNode = mockedCPUModel({
			location: SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
			profilerHits: 3,
			sensorValues: {
				selfCPUTime: 30 as MicroSeconds_number,
				aggregatedCPUTime: 60 as MicroSeconds_number
			},
			children: [{
				location: SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				profilerHits: 2,
				sensorValues: {
					selfCPUTime: 20 as MicroSeconds_number,
					aggregatedCPUTime: 30 as MicroSeconds_number
				},
				children: [
					{
						location: SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
						profilerHits: 1,
						sensorValues: {
							selfCPUTime: 10 as MicroSeconds_number,
							aggregatedCPUTime: 10 as MicroSeconds_number
						}
					}
				]
			}]
		})

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		console.log(JSON.stringify(projectReport.extern.toJSON(), null, 2))
		console.log(JSON.stringify(projectReport.intern.toJSON(), null, 2))

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toEqual({
			'3': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
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
							profilerHits: 3,
							selfCPUTime: 30,
							aggregatedCPUTime: 50,
							externCPUTime: 20
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
							}
						}
					},
					'6': {
						id: 6,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 10,
							aggregatedCPUTime: 10,
						}
					}
				}
			}
		})
	})
})