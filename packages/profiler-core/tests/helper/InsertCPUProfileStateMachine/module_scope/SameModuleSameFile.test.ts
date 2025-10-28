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
	createLocationTreeCPUModel,
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from '../mock'
import { EXAMPLE_EXECUTION_DETAILS } from '../../../model/assets/ProjectReport/ExecutionDetails'

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
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2']
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 60
		})
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
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
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0']
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 30
		})
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
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
									aggregatedCPUTime: 30
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
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1']
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 100
		})
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
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

	// ------ split cases ------

	test('mA.A0 -> (mA.A1 || mA.A2)', async () => {
		/*
			mA.A0: 10 | 50
			├── mA.A1: 20 | 20
			└── mA.A2: 20 | 20
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				[
					[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'], []],
					[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'], []]
				]
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 50
		})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()
		expect(projectReport.intern.toJSON()).toBeUndefined()
		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 50,
									internCPUTime: 40
								},
								intern: {
									'4': {
										id: 4,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 2,
											selfCPUTime: 20,
											aggregatedCPUTime: 20
										}
									},
									'5': {
										id: 5,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 2,
											selfCPUTime: 20,
											aggregatedCPUTime: 20
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
									aggregatedCPUTime: 20
								}
							},
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
	})

	test('mA.A0 -> (mA.A0 -> mA.A0 -> mA.A0 || mA.A0 -> mA.A0 -> mA.A0 || mA.A0 -> mA.A0 -> mA.A0)', async () => {
		/*
			mA.A0: 10 | 280
			├── mA.A0: 20 | 90
			│    └── mA.A0: 30 | 70
			│         └── mA.A0: 40 | 40
			├── mA.A0: 20 | 90
			│    └── mA.A0: 30 | 70
			│         └── mA.A0: 40 | 40
			└── mA.A0: 20 | 90
						└── mA.A0: 30 | 70
								└── mA.A0: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'], []]]
							]
						]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'], []]]
							]
						]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'], []]]
							]
						]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 280
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 28,
									selfCPUTime: 280,
									aggregatedCPUTime: 280
								}
							}
						}
					}
				}
			}
		})
	})

	test('mA.A0 -> (mA.A1 -> mA.A1 -> mA.A1 || mA.A2 -> mA.A1 -> mA.A1 || mA.A1 -> mA.A1 -> mA.A1)', async () => {
		/*
			mA.A0: 10 | 280
			├── mA.A1: 20 | 90
			│    └── mA.A1: 30 | 70
			│         └── mA.A1: 40 | 40
			├── mA.A2: 20 | 90
			│    └── mA.A2: 30 | 70
			│         └── mA.A2: 40 | 40
			└── mA.A1: 20 | 90
						└── mA.A1: 30 | 70
								└── mA.A1: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'], []]]
							]
						]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'], []]]
							]
						]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'], []]]
							]
						]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 280
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 280,
									internCPUTime: 270
								},
								intern: {
									'4': {
										id: 4,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 4,
											selfCPUTime: 40,
											aggregatedCPUTime: 180
										}
									},
									'5': {
										id: 5,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 2,
											selfCPUTime: 20,
											aggregatedCPUTime: 90
										}
									}
								}
							},
							'4': {
								id: 4,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 18,
									selfCPUTime: 180,
									aggregatedCPUTime: 180
								}
							},
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 9,
									selfCPUTime: 90,
									aggregatedCPUTime: 90
								}
							}
						}
					}
				}
			}
		})
	})

	test('mA.A0 -> (mA.A1 -> mA.A0 -> mA.A1 || mA.A2 -> mA.A0 -> mA.A2)', async () => {
		/*
			mA.A0: 10 | 190
			├── mA.A1: 20 | 90
			│    └── mA.A0: 30 | 70
			│         └── mA.A1: 40 | 40
			└── mA.A2: 20 | 90
						└── mA.A0: 30 | 70
								└── mA.A2: 40 | 40
		*/

		const cpuNode = mockedCPUModel(
			createLocationTreeCPUModel([
				SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
				[
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'], []]]
							]
						]
					],
					[
						SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'],
						[
							[
								SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
								[[SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-2'], []]]
							]
						]
					]
				]
			])
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.headlessSensorValues.toJSON()).toEqual({
			externCPUTime: 190
		})
		expect(projectReport.intern.toJSON()).toBeUndefined()
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.extern.toJSON()).toEqual({
			'1': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				headlessSensorValues: {},
				intern: {
					'2': {
						path: './fileA.js',
						functions: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 7,
									selfCPUTime: 70,
									aggregatedCPUTime: 190,
									internCPUTime: 180
								},
								intern: {
									'4': {
										id: 4,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 6,
											selfCPUTime: 60,
											aggregatedCPUTime: 90
										}
									},
									'5': {
										id: 5,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 6,
											selfCPUTime: 60,
											aggregatedCPUTime: 90
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
									'3': {
										id: 3,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 3,
											selfCPUTime: 30,
											aggregatedCPUTime: 70
										}
									}
								}
							},
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 90,
									internCPUTime: 70
								},
								intern: {
									'3': {
										id: 3,
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
				}
			}
		})
	})
})
