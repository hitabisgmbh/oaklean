import { SourceFileMetaData, AggregatedSourceNodeMetaData } from '../../src/model/SourceFileMetaData'
import { SourceNodeMetaData } from '../../src/model/SourceNodeMetaData'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'
import { SensorValues } from '../../src/model/SensorValues'
import { GlobalIndex } from '../../src/model/index/GlobalIndex'
import { PathIndex } from '../../src/model/index/PathIndex'
import { NodeModule } from '../../src/model/NodeModule'
import {
	ISourceFileMetaData,
	SourceNodeMetaDataType,
	ISourceNodeMetaData,
	UnifiedPath_string,
	ISensorValues,
	MilliJoule_number,
	SourceNodeID_number,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	MicroSeconds_number,
	IAggregatedSourceNodeMetaData,
	PathID_number
} from '../../src/types'
import { ModelMap } from '../../src'

const EXAMPLE_SOURCE_FILE_META_DATA: ISourceFileMetaData = {
	path: './file.js' as UnifiedPath_string,
	functions: {
		[2 as SourceNodeID_number]: {
			id: 2 as SourceNodeID_number,
			type: SourceNodeMetaDataType.SourceNode,
			sensorValues: {
				profilerHits: 2,

				selfCPUTime: 4,
				aggregatedCPUTime: 4,

				selfCPUEnergyConsumption: 8,
				aggregatedCPUEnergyConsumption: 8,

				selfRAMEnergyConsumption: 8,
				aggregatedRAMEnergyConsumption: 8,
			} as ISensorValues
		},
		[3 as SourceNodeID_number]: {
			id: 3 as SourceNodeID_number,
			type: SourceNodeMetaDataType.SourceNode,
			sensorValues: {
				profilerHits: 1,

				selfCPUTime: 3,
				aggregatedCPUTime: 3,

				selfCPUEnergyConsumption: 6,
				aggregatedCPUEnergyConsumption: 6,

				selfRAMEnergyConsumption: 6,
				aggregatedRAMEnergyConsumption: 6
			} as ISensorValues
		}
	}
}

const EXAMPLE_SOURCE_FILE_META_DATA_BUFFER = '010000000200000002000000020200000000000000c718020000000400000004000000000000000000204000000000000020400000000000002040000000000000204000000000000000000000000003000000020300000000000000c7180100000003000000030000000000000000001840000000000000184000000000000018400000000000001840000000000000000000000000'

describe('AggregatedSourceNodeMetaData', () => {
	describe('instance related', () => {
		let instance: AggregatedSourceNodeMetaData

		beforeEach(() => {
			instance = new AggregatedSourceNodeMetaData(
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 1 as MicroSeconds_number,
						selfCPUTime: 2 as MicroSeconds_number,
						aggregatedCPUTime: 3 as MicroSeconds_number,
						internCPUTime: 4 as MicroSeconds_number,
						externCPUTime: 5 as MicroSeconds_number,
						langInternalCPUTime: 6 as MicroSeconds_number
					}),
					undefined
				),
				new SourceNodeMetaData(
					SourceNodeMetaDataType.Aggregate,
					undefined,
					new SensorValues({
						profilerHits: 7 as MicroSeconds_number,
						selfCPUTime: 8 as MicroSeconds_number,
						aggregatedCPUTime: 9 as MicroSeconds_number,
						internCPUTime: 10 as MicroSeconds_number,
						externCPUTime: 11 as MicroSeconds_number,
						langInternalCPUTime: 12 as MicroSeconds_number
					}),
					undefined
				)
			)
		})

		it('instance should be an instanceof AggregatedSourceNodeMetaData', () => {
			expect(instance instanceof AggregatedSourceNodeMetaData).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(AggregatedSourceNodeMetaData.fromJSON).toBeTruthy()
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(
				{
					total: {
						type: SourceNodeMetaDataType.Aggregate,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 2,
							aggregatedCPUTime: 3,
							internCPUTime: 4,
							externCPUTime: 5,
							langInternalCPUTime: 6
						}
					} as SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
					max: {
						type: SourceNodeMetaDataType.Aggregate,
						sensorValues: {
							profilerHits: 7,
							selfCPUTime: 8,
							aggregatedCPUTime: 9,
							internCPUTime: 10,
							externCPUTime: 11,
							langInternalCPUTime: 12
						}
					} as SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
				}
			)
		})
	})

	describe('deserialization', () => {
		const expected: IAggregatedSourceNodeMetaData = {
			total: {
				id: undefined,
				type: SourceNodeMetaDataType.Aggregate,
				sensorValues: {
					profilerHits: 1,
					selfCPUTime: 2 as MicroSeconds_number,
					aggregatedCPUTime: 3 as MicroSeconds_number,
					internCPUTime: 4 as MicroSeconds_number,
					externCPUTime: 5 as MicroSeconds_number,
					langInternalCPUTime: 6 as MicroSeconds_number
				}
			},
			max: {
				id: undefined,
				type: SourceNodeMetaDataType.Aggregate,
				sensorValues: {
					profilerHits: 7 as MicroSeconds_number,
					selfCPUTime: 8 as MicroSeconds_number,
					aggregatedCPUTime: 9 as MicroSeconds_number,
					internCPUTime: 10 as MicroSeconds_number,
					externCPUTime: 11 as MicroSeconds_number,
					langInternalCPUTime: 12 as MicroSeconds_number
				} as ISensorValues
			}
		}
		test('deserialization from string', () => {
			const aggregatedSourceNodeMetaData = AggregatedSourceNodeMetaData.fromJSON(JSON.stringify(expected))
			expect(aggregatedSourceNodeMetaData.toJSON()).toEqual(expected)
		})

		test('deserialization from object', () => {
			const aggregatedSourceNodeMetaData = AggregatedSourceNodeMetaData.fromJSON(expected)
			expect(aggregatedSourceNodeMetaData.toJSON()).toEqual(expected)
		})
	})
})

function runInstanceTests(
	title: string,
	preDefinedInstance: () => SourceFileMetaData
) {
	describe(title, () => {
		let instance: SourceFileMetaData

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof SourceFileMetaData', () => {
			expect(instance instanceof SourceFileMetaData).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SourceFileMetaData.fromJSON).toBeTruthy()
		})

		it('should have a static method merge()', () => {
			expect(SourceFileMetaData.merge).toBeTruthy()
		})

		it('should have a method createOrGetSourceNodeMetaData()', () => {
			expect(instance.createOrGetSourceNodeMetaData).toBeTruthy()
		})

		it('should have a method totalSourceNodeMetaData()', () => {
			expect(instance.totalSourceNodeMetaData).toBeTruthy()
		})

		it('should have a method maxSourceNodeMetaData()', () => {
			expect(instance.maxSourceNodeMetaData).toBeTruthy()
		})

		test('createOrAddToNode', () => {
			expect(instance.functions.toJSON()).toEqual({
				2: {
					id: 2,
					type: SourceNodeMetaDataType.SourceNode,
					sensorValues: {
						profilerHits: 2,

						selfCPUTime: 4,
						aggregatedCPUTime: 4,

						selfCPUEnergyConsumption: 8,
						aggregatedCPUEnergyConsumption: 8,

						selfRAMEnergyConsumption: 8,
						aggregatedRAMEnergyConsumption: 8
					} as ISensorValues
				},
				3: {
					id: 3,
					type: SourceNodeMetaDataType.SourceNode,
					sensorValues: {
						profilerHits: 1,

						selfCPUTime: 3,
						aggregatedCPUTime: 3,

						selfCPUEnergyConsumption: 6,
						aggregatedCPUEnergyConsumption: 6,

						selfRAMEnergyConsumption: 6,
						aggregatedRAMEnergyConsumption: 6,
					} as ISensorValues
				},
			})
		})

		test('totalSourceNodeMetaData', () => {
			const result = instance.totalSourceNodeMetaData()
			expect(Object.keys(result).length).toBe(4)

			expect({
				sum: result.sum.toJSON(),
				intern: result.intern.toJSON(),
				extern: result.extern.toJSON(),
				langInternal: result.langInternal.toJSON()
			}).toEqual({
				sum: {
					id: undefined,
					type: SourceNodeMetaDataType.Aggregate,
					sensorValues: {
						profilerHits: 3 as MicroSeconds_number,

						selfCPUTime: 7 as MicroSeconds_number,
						aggregatedCPUTime: 7 as MicroSeconds_number,

						selfCPUEnergyConsumption: 14 as MilliJoule_number,
						aggregatedCPUEnergyConsumption: 14 as MilliJoule_number,

						selfRAMEnergyConsumption: 14 as MilliJoule_number,
						aggregatedRAMEnergyConsumption: 14 as MilliJoule_number
					}
				},
				intern: undefined,
				extern: undefined,
				langInternal: undefined
			} satisfies {
				sum: ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
				intern: ReturnType<ModelMap<PathID_number, SensorValues>['toJSON']>,
				extern: ReturnType<ModelMap<PathID_number, SensorValues>['toJSON']>,
				langInternal: ReturnType<ModelMap<PathID_number, SensorValues>['toJSON']>
			})
		})

		test('maxSourceNodeMetaData', () => {
			expect(instance.maxSourceNodeMetaData().toJSON()).toEqual({
				type: SourceNodeMetaDataType.Aggregate,
				sensorValues: {
					profilerHits: 2,

					selfCPUTime: 4,
					aggregatedCPUTime: 4,

					selfCPUEnergyConsumption: 8,
					aggregatedCPUEnergyConsumption: 8,

					selfRAMEnergyConsumption: 8,
					aggregatedRAMEnergyConsumption: 8
				} as ISensorValues
			})
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_SOURCE_FILE_META_DATA)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toEqual(EXAMPLE_SOURCE_FILE_META_DATA_BUFFER)
		})

		test('containsUncommittedChanges', () => {
			// containsUncommittedChanges is directly derived from the pathIndex
			expect(instance.containsUncommittedChanges).toBe(false)
			instance.pathIndex.containsUncommittedChanges = true
			expect(instance.containsUncommittedChanges).toBe(true)
		})
	})
}

describe('SourceFileMetaData', () => {
	runInstanceTests('instance related', () => {
		const filePath = new UnifiedPath('./file.js').toString()
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

		const instance = new SourceFileMetaData(
			filePath,
			pathIndex
		)

		const node1 = instance.createOrGetSourceNodeMetaData(
			'{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)
		node1.addToSensorValues({
			cpuTime: {
				selfCPUTime: 2 as MicroSeconds_number,
				aggregatedCPUTime: 2 as MicroSeconds_number
			},
			cpuEnergyConsumption: {
				selfCPUEnergyConsumption: 4 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 4 as MilliJoule_number
			},
			ramEnergyConsumption: {
				selfRAMEnergyConsumption: 4 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 4 as MilliJoule_number
			}
		})
		node1.sensorValues.profilerHits += 1

		const node2 = instance.createOrGetSourceNodeMetaData(
			'{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)
		node2.addToSensorValues({
			cpuTime: {
				selfCPUTime: 3 as MicroSeconds_number,
				aggregatedCPUTime: 3 as MicroSeconds_number
			},
			cpuEnergyConsumption: {
				selfCPUEnergyConsumption: 6 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 6 as MilliJoule_number
			},
			ramEnergyConsumption: {
				selfRAMEnergyConsumption: 6 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 6 as MilliJoule_number
			}
		})
		node2.sensorValues.profilerHits += 1

		const node3 = instance.createOrGetSourceNodeMetaData(
			'{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)
		node3.addToSensorValues({
			cpuTime: {
				selfCPUTime: 2 as MicroSeconds_number,
				aggregatedCPUTime: 2 as MicroSeconds_number
			},
			cpuEnergyConsumption: {
				selfCPUEnergyConsumption: 4 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 4 as MilliJoule_number
			},
			ramEnergyConsumption: {
				selfRAMEnergyConsumption: 4 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 4 as MilliJoule_number
			}
		})
		node3.sensorValues.profilerHits += 1

		return instance
	})

	describe('deserialization', () => {
		let globalIndex: GlobalIndex
		let pathIndex: PathIndex

		beforeEach(() => {
			const filePath = new UnifiedPath('./file.js').toString()
			globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)
			pathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)
			pathIndex.getSourceNodeIndex('upsert', '{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)
		})

		test('deserialization from string', () => {
			const instanceFromString = SourceFileMetaData.fromJSON(
				JSON.stringify(EXAMPLE_SOURCE_FILE_META_DATA), pathIndex
			)
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_SOURCE_FILE_META_DATA)
		})

		test('deserialization from object', () => {
			const instanceFromObject = SourceFileMetaData.fromJSON(EXAMPLE_SOURCE_FILE_META_DATA, pathIndex)
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_SOURCE_FILE_META_DATA)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromString = SourceFileMetaData.fromJSON(
				JSON.stringify(EXAMPLE_SOURCE_FILE_META_DATA), pathIndex
			)
			return instanceFromString
		})
	})

	describe('consume from buffer', () => {
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const filePath = new UnifiedPath('./file.js').toString()
		const filePathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)
		filePathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)
		filePathIndex.getSourceNodeIndex('upsert', '{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)

		const buffer = Buffer.from(EXAMPLE_SOURCE_FILE_META_DATA_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = SourceFileMetaData.consumeFromBuffer(buffer, globalIndex)
			expect(instance.toJSON()).toEqual(EXAMPLE_SOURCE_FILE_META_DATA)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = SourceFileMetaData.consumeFromBuffer(buffer, globalIndex)
			return instance
		})
	})

	describe('merging', () => {
		let instancesToMerge: SourceFileMetaData[] = []
		beforeEach(() => {
			const firstGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const firstPathIndex = firstGlobalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', './file.js' as UnifiedPath_string)
			
			const first = SourceFileMetaData.fromJSON({
				path: './file.js' as UnifiedPath_string,
				functions: {
					[firstPathIndex.getSourceNodeIndex(
						'upsert',
						'{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: firstPathIndex.getSourceNodeIndex(
							'upsert',
							'{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 4,
							aggregatedCPUTime: 9945,
							langInternalCPUTime: 30,
							internCPUTime: 77,
							externCPUTime: 9834,
						},
						lang_internal: {
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									aggregatedCPUTime: 10
								}
							},
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									aggregatedCPUTime: 20
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
						intern: {
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 33
								}
							},
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 44
								}
							}
						} as Record<
						GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>,
						extern: {
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 125,
									aggregatedCPUTime: 9834
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>>
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					[firstPathIndex.getSourceNodeIndex(
						'upsert',
						'{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: firstPathIndex.getSourceNodeIndex(
							'upsert',
							'{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 3,
							aggregatedCPUTime: 173,
							langInternalCPUTime: 170,
						},
						lang_internal: {
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									aggregatedCPUTime: 50
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
							[firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: firstGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									aggregatedCPUTime: 120
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
				} as Record<SourceNodeIdentifier_string, ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>>
			}, firstPathIndex)

			const secondGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const secondPathIndex = secondGlobalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', './file.js' as UnifiedPath_string)

			const second = SourceFileMetaData.fromJSON({
				path: './file.js' as UnifiedPath_string,
				functions: {
					[secondPathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: secondPathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 4,
							aggregatedCPUTime: 10411,
							langInternalCPUTime: 330,
							internCPUTime: 77,
							externCPUTime: 10000,
						},
						lang_internal: {
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									aggregatedCPUTime: 20
								}
							},
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									aggregatedCPUTime: 60
								}
							},
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 250,
									aggregatedCPUTime: 250
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
						intern: {
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 33
								}
							},
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/d.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/d.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 44
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>,
						extern: {
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 250,
									aggregatedCPUTime: 10000
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>>
					},
					[secondPathIndex.getSourceNodeIndex('upsert', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: secondPathIndex.getSourceNodeIndex('upsert', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 6,
							aggregatedCPUTime: 306,
							langInternalCPUTime: 170,
							internCPUTime: 130
						},
						lang_internal: {
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									aggregatedCPUTime: 50
								}
							},
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									aggregatedCPUTime: 120
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
						intern: {
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 20,
									aggregatedCPUTime: 50
								}
							},
							[secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: secondGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 30,
									aggregatedCPUTime: 80
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>,
					},
				} as Record<SourceNodeIdentifier_string, ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>>
			}, secondPathIndex)

			const thirdGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const thirdPathIndex = thirdGlobalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', './file.js' as UnifiedPath_string)

			const third = SourceFileMetaData.fromJSON({
				path: './file.js' as UnifiedPath_string,
				functions: {
					[thirdPathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: thirdPathIndex.getSourceNodeIndex('upsert', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 2,
							selfCPUTime: 4,
							aggregatedCPUTime: 17734,
							langInternalCPUTime: 400,
							internCPUTime: 579,
							externCPUTime: 16751,
						},
						lang_internal: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									aggregatedCPUTime: 50
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									aggregatedCPUTime: 100
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 250,
									aggregatedCPUTime: 250
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
						intern: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 3,
									selfCPUTime: 10,
									aggregatedCPUTime: 123
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									selfCPUTime: 10,
									aggregatedCPUTime: 456
								}	
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>,
						extern: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 250,
									aggregatedCPUTime: 10000
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 334,
									aggregatedCPUTime: 6751
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>>
					},
					[thirdPathIndex.getSourceNodeIndex('upsert', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id]: {
						id: thirdPathIndex.getSourceNodeIndex('upsert', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string).id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 3,
							aggregatedCPUTime: 10094,
							langInternalCPUTime: 180,
							internCPUTime: 77,
							externCPUTime: 9834
						},
						lang_internal: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 10,
									aggregatedCPUTime: 100
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									aggregatedCPUTime: 80
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>>,
						intern: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									selfCPUTime: 12,
									aggregatedCPUTime: 33
								}
							},
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 7,
									selfCPUTime: 11,
									aggregatedCPUTime: 44
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>>,
						extern: {
							[thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string)).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 125,
									aggregatedCPUTime: 9834
								}
							}
						} as Record<GlobalSourceNodeIdentifier_string,
						ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>>
					},
				} as Record<SourceNodeIdentifier_string, ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>>
			}, thirdPathIndex)

			instancesToMerge = [first, second, third]
		})

		test('empty arguments', () => {
			const filePath = new UnifiedPath('./file.js').toString()
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

			const t = () => {
				SourceFileMetaData.merge(pathIndex, ...[])
			}

			expect(t).toThrowError('SourceFileMetaData.merge: no SourceFileMetaDatas were given')
		})

		test('wrong paths', () => {
			const filePath = new UnifiedPath('./file.js').toString()
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

			instancesToMerge[1].path = './abc.js' as UnifiedPath_string

			const t = () => {
				SourceFileMetaData.merge(pathIndex, ...instancesToMerge)
			}

			expect(t).toThrowError('SourceFileMetaData.merge: all SourceFileMetaDatas should be from the same file.')
		})

		test('merges correctly', () => {
			const filePath = new UnifiedPath('./file.js').toString()
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

			const mergeResult = SourceFileMetaData.merge(pathIndex, ...instancesToMerge)

			expect(mergeResult.toJSON()).toEqual({
				path: './file.js',
				functions: {
					[pathIndex.getSourceNodeIndex('get', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1]: {
						id: pathIndex.getSourceNodeIndex('get', '{root}{class:class}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 5,
							selfCPUTime: 12,
							aggregatedCPUTime: 38090,
							langInternalCPUTime: 760,
							internCPUTime: 733,
							externCPUTime: 36585
						},
						lang_internal: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 8,
									aggregatedCPUTime: 80
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 9,
									aggregatedCPUTime: 180
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{stopSamplingHeapProfiling}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									selfCPUTime: 500,
									aggregatedCPUTime: 500
								}
							}
						},
						intern: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 4,
									selfCPUTime: 20,
									aggregatedCPUTime: 156
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 44
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/c.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									selfCPUTime: 20,
									aggregatedCPUTime: 489
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/d.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/d.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 10,
									aggregatedCPUTime: 44
								}
							}
						},
						extern: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									selfCPUTime: 625,
									aggregatedCPUTime: 29834
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 2,
									selfCPUTime: 334,
									aggregatedCPUTime: 6751
								}
							}
						}
					},
					[pathIndex.getSourceNodeIndex('get', '{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1]: {
						id: pathIndex.getSourceNodeIndex('get', '{root}{class:class2}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 3,
							aggregatedCPUTime: 173,
							langInternalCPUTime: 170
						},
						lang_internal: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 5,
									aggregatedCPUTime: 50
								}	
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 6,
									aggregatedCPUTime: 120
								}
							}
						}
					},
					[pathIndex.getSourceNodeIndex('get', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1]: {
						id: pathIndex.getSourceNodeIndex('get', '{root}{class:class3}.{method:method}.{functionExpression:0}' as SourceNodeIdentifier_string)?.id || -1,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							profilerHits: 3,
							selfCPUTime: 9,
							aggregatedCPUTime: 10400,
							langInternalCPUTime: 350,
							internCPUTime: 207,
							externCPUTime: 9834,
						},
						lang_internal: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{consoleCall}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 15,
									aggregatedCPUTime: 150
								}
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{}{(garbage collector)}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 10,
									aggregatedCPUTime: 200
								}
							}
						},
						intern: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/a.js}{root}.{class:HelperA}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 7,
									selfCPUTime: 32,
									aggregatedCPUTime: 83
								}	
							},
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('{./dist/helper/b.js}{root}.{class:HelperB}.{method:process}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 10,
									selfCPUTime: 41,
									aggregatedCPUTime: 124
								}
							}
						},
						extern: {
							[globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1]: {
								id: globalIndex.getSourceNodeIndex('get', GlobalIdentifier.fromIdentifier('html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string))?.id || -1,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 125,
									aggregatedCPUTime: 9834
								}
							}
						}
					}
				}
			})
		})

		describe('merges containsUncommittedChanges correctly', () => {
			test('all false', () => {
				const filePath = new UnifiedPath('./file.js').toString()
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

				instancesToMerge[0].containsUncommittedChanges = false
				instancesToMerge[1].containsUncommittedChanges = false
				instancesToMerge[2].containsUncommittedChanges = false

				const mergeResult = SourceFileMetaData.merge(pathIndex, ...instancesToMerge)

				expect(mergeResult.containsUncommittedChanges).toBe(false)
			})

			test('one is true', () => {
				const filePath = new UnifiedPath('./file.js').toString()
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', filePath)

				instancesToMerge[0].containsUncommittedChanges = false
				instancesToMerge[1].containsUncommittedChanges = true
				instancesToMerge[2].containsUncommittedChanges = false

				const mergeResult = SourceFileMetaData.merge(pathIndex, ...instancesToMerge)

				expect(mergeResult.containsUncommittedChanges).toBe(true)
			})
		})
	})

	test('totalSourceNodeMetaData', () => {
		/**
			* // File: FileA
			* ClassA:
			* 		functionA:
			* 				selfTime: 1
			* 				aggregatedTime: 6
			* 				intern:
			* 					ClassA.functionB:
			* 						aggregatedTime: 5
			* 		functionB:
			* 				selfTime: 2
			* 				aggregatedTime: 5
			* 				intern:
			* 					ClassA.functionC:
			* 						aggregatedTime: 3
			* 		functionC:
			* 				selfTime: 2
			* 				aggregatedTime: 3
			* 				intern:
			* 					ClassB.functionA:
			* 						aggregatedTime: 1
			* 
			* // File: FileB
			* ClassB:
			* 		functionD:
			* 				selfTime: 1
			* 				aggregatedTime: 1
		 */
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const selfModuleIndex = globalIndex.getModuleIndex('upsert')
		const filePathIndexA = selfModuleIndex.getFilePathIndex('upsert', './fileA.js' as UnifiedPath_string)
		const filePathIndexB = selfModuleIndex.getFilePathIndex('upsert', './fileB.js' as UnifiedPath_string)

		const sourceFileMetaDataA = new SourceFileMetaData(
			'./fileA.js' as UnifiedPath_string,
			filePathIndexA
		)

		const sourceFileMetaDataB = new SourceFileMetaData(
			'./fileB.js' as UnifiedPath_string,
			filePathIndexB
		)

		const methodA = sourceFileMetaDataA.createOrGetSourceNodeMetaData(
			'{root}{class:ClassA}.{method:methodA}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)

		const methodB = sourceFileMetaDataA.createOrGetSourceNodeMetaData(
			'{root}{class:ClassA}.{method:methodB}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)

		const methodC = sourceFileMetaDataA.createOrGetSourceNodeMetaData(
			'{root}{class:ClassA}.{method:methodC}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)

		const methodD = sourceFileMetaDataB.createOrGetSourceNodeMetaData(
			'{root}{class:ClassB}.{method:methodD}' as SourceNodeIdentifier_string,
			SourceNodeMetaDataType.SourceNode
		)

		methodD.addToSensorValues({
			cpuTime: {
				selfCPUTime: 1 as MicroSeconds_number,
				aggregatedCPUTime: 1 as MicroSeconds_number
			},
			cpuEnergyConsumption: {},
			ramEnergyConsumption: {}
		})

		methodA.addToSensorValues({
			cpuTime: {
				selfCPUTime: 1 as MicroSeconds_number,
				aggregatedCPUTime: 6 as MicroSeconds_number
			},
			cpuEnergyConsumption: {},
			ramEnergyConsumption: {}
		})
		methodA.addSensorValuesToIntern(
			methodB.globalIdentifier(),
			{
				cpuTime: {
					aggregatedCPUTime: 5 as MicroSeconds_number
				},
				cpuEnergyConsumption: {},
				ramEnergyConsumption: {}
			}
		)

		methodB.addToSensorValues({
			cpuTime: {
				selfCPUTime: 2 as MicroSeconds_number,
				aggregatedCPUTime: 5 as MicroSeconds_number
			},
			cpuEnergyConsumption: {},
			ramEnergyConsumption: {}
		})
		methodB.addSensorValuesToIntern(
			methodC.globalIdentifier(),
			{
				cpuTime: {
					aggregatedCPUTime: 3 as MicroSeconds_number
				},
				cpuEnergyConsumption: {},
				ramEnergyConsumption: {}
			}
		)

		methodC.addToSensorValues({
			cpuTime: {
				selfCPUTime: 2 as MicroSeconds_number,
				aggregatedCPUTime: 3 as MicroSeconds_number
			},
			cpuEnergyConsumption: {},
			ramEnergyConsumption: {}
		})

		methodC.addSensorValuesToIntern(
			methodD.globalIdentifier(),
			{
				cpuTime: {
					aggregatedCPUTime: 1 as MicroSeconds_number
				},
				cpuEnergyConsumption: {},
				ramEnergyConsumption: {}
			}
		)

		const result = sourceFileMetaDataA.totalSourceNodeMetaData()

		expect(result.sum.toJSON()).toEqual({
			type: 5,
			sensorValues: {
				selfCPUTime: 5,
				aggregatedCPUTime: 6,
				internCPUTime: 1
			}
		})

		expect(result.intern.toJSON()).toEqual({
			2: {
				aggregatedCPUTime: 1
			}
		})

		expect(result.extern.toJSON()).toBeUndefined()

		expect(result.langInternal.toJSON()).toBeUndefined()
	})
})
