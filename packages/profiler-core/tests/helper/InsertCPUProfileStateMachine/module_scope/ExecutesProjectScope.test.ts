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

	// call from module scope into project scope
	test('mA.A0 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0']
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
							aggregatedCPUTime: 10
						}
					}
				}
			}
		})
	})

	// call from project scope into module scope and back into project scope
	test('A0 -> mA.A0 -> A1', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
				]
			)
		)

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
							aggregatedCPUTime: 10
						}
					}
				}
			}
		})
	})

	// calls within project scopes into module scope and back into project scope
	test('A0 -> A1 -> mA.A0 -> A2', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.extern.toJSON()).toEqual({
			'4': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
				intern: {
					'5': {
						path: './fileA.js',
						functions: {
							'6': {
								id: 6,
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
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 90,
							internCPUTime: 50
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 50
								}
							}
						}
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 3,
							selfCPUTime: 30,
							aggregatedCPUTime: 50,
							externCPUTime: 20
						},
						extern: {
							'6': {
								id: 6,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 20
								}
							}
						}
					},
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
		})
	})

	// recursive across a single compensation
	test('A0 -> mA.A0 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

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
							profilerHits: 4,
							selfCPUTime: 40,
							aggregatedCPUTime: 60,
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
					}
				}
			}
		})
	})

	// recursive across two compensations
	test('A0 -> mA.A0 -> A0 -> mA.A0 -> A0', async () => {

		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 9,
							selfCPUTime: 90,
							externCPUTime: 60,
							aggregatedCPUTime: 150
						},
						extern: {
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 60
								}
							}
						}
					}
				}
			}
		})

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
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 60
								}
							}
						}
					}
				}
			}
		})
	})

	// recursive before compensations
	test('A0 -> mA.A0 -> A0 -> A0 -> mA.A0 -> A0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 14,
							selfCPUTime: 140,
							externCPUTime: 70,
							aggregatedCPUTime: 210
						},
						extern: {
							'5': {
								id: 5,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 7,
									selfCPUTime: 70,
									aggregatedCPUTime: 70
								}
							}
						}
					}
				}
			}
		})

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
									profilerHits: 7,
									selfCPUTime: 70,
									aggregatedCPUTime: 70
								}
							}
						}
					}
				}
			}
		})
	})

	// multiple switches between project and module scope + recursion + different chain lengths
	test('A0 -> A1 -> mA.A0 -> mA.A1 -> A2 -> A1 -> mA.A0 -> A0 -> mA.A1 -> A2', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 13,
							selfCPUTime: 130,
							aggregatedCPUTime: 390,
							internCPUTime: 240,
							externCPUTime: 20,
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 9,
									selfCPUTime: 90,
									aggregatedCPUTime: 240
								}
							}
						},
						extern: {
							'7': {
								id: 7,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
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
							profilerHits: 14,
							selfCPUTime: 140,
							externCPUTime: 190,
							aggregatedCPUTime: 330
						},
						extern: {
							'6': {
								id: 6,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 12,
									selfCPUTime: 120,
									aggregatedCPUTime: 190
								}
							}
						}
					},
					'8': {
						id: 8,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 7,
							selfCPUTime: 70,
							aggregatedCPUTime: 160,
							internCPUTime: 90
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									selfCPUTime: 50,
									aggregatedCPUTime: 90
								}
							}
						}
					}
				}
			}
		})

		expect(projectReport.extern.toJSON()).toEqual({
			'4': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
				intern: {
					'5': {
						path: './fileA.js',
						functions: {
							'6': {
								id: 6,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 12,
									selfCPUTime: 120,
									aggregatedCPUTime: 190,
									internCPUTime: 70
								},
								intern: {
									'7': {
										id: 7,
										type: SourceNodeMetaDataType.InternSourceNodeReference,
										sensorValues: {
											profilerHits: 7,
											selfCPUTime: 70,
											aggregatedCPUTime: 70
										}
									}
								}
							},
							'7': {
								id: 7,
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

	// recursive before compensation
	test('A0 -> A0 -> A0 -> mA.A0 -> A1', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1']
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 12,
							selfCPUTime: 120,
							aggregatedCPUTime: 140,
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
							aggregatedCPUTime: 10
						}
					}
				}
			}
		})

		expect(projectReport.extern.toJSON()).toEqual({
			'3': {
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
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
	})

	// recursion between compensations
	test('A0 -> A1 -> mA.A0 -> A2 -> A2 -> A2 -> mA.A1 -> B0', async () => {
		const cpuNode = mockedCPUModel(
			createLocationChainCPUModel(
				[
					SOURCE_LOCATIONS_DEFAULT['project-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
					SOURCE_LOCATIONS_DEFAULT['project-fileA-2'],
					SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-1'],
					SOURCE_LOCATIONS_DEFAULT['project-fileB-0'],
				]
			)
		)

		await stateMachine.insertCPUNodes(
			cpuNode,
			MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
		)

		expect(projectReport.lang_internalHeadlessSensorValues.toJSON()).toEqual({})
		expect(projectReport.lang_internal.toJSON()).toBeUndefined()

		expect(projectReport.intern.toJSON()).toEqual({
			'1': {
				path: './src/fileA.js',
				functions: {
					'2': {
						id: 2,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 8,
							selfCPUTime: 80,
							aggregatedCPUTime: 210,
							internCPUTime: 130
						},
						intern: {
							'3': {
								id: 3,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 7,
									selfCPUTime: 70,
									aggregatedCPUTime: 130
								}
							}
						},
					},
					'3': {
						id: 3,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 7,
							selfCPUTime: 70,
							externCPUTime: 60,
							aggregatedCPUTime: 130
						},
						extern: {
							'6': {
								id: 6,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 60
								}
							}
						}
					},
					'7': {
						id: 7,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 12,
							selfCPUTime: 120,
							aggregatedCPUTime: 140,
							externCPUTime: 20
						},
						extern: {
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
				},
			},
			'9': {
				path: './src/fileB.js',
				functions: {
					'10': {
						id: 10,
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

		expect(projectReport.extern.toJSON()).toEqual({
			'4': {
				reportVersion: projectReport.reportVersion,
				kind: ReportKind.measurement,
				nodeModule: {
					name: 'moduleA',
					version: '1.0.0'
				},
				lang_internalHeadlessSensorValues: {},
				intern: {
					'5': {
						path: './fileA.js',
						functions: {
							'6': {
								id: 6,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 6,
									selfCPUTime: 60,
									aggregatedCPUTime: 60
								}
							},
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
	})
})
