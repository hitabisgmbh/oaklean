import { NodeModule } from '../../src/model/NodeModule'
import { SensorValues } from '../../src/model/SensorValues'
import { SourceNodeMetaData } from '../../src/model/SourceNodeMetaData'
import { GlobalIndex } from '../../src/model/indices/GlobalIndex'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'
// Types
import {
	SourceNodeID_number,
	MilliJoule_number,
	ISourceNodeMetaData,
	SourceNodeMetaDataType,
	UnifiedPath_string,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	MicroSeconds_number
} from '../../src/types'

const EXAMPLE_SOURCE_NODE_META_DATA = {
	id: 2 as SourceNodeID_number,
	type: SourceNodeMetaDataType.SourceNode,
	sensorValues: {
		langInternalCPUTime: 9699 as MicroSeconds_number,
		internCPUTime: 1245 as MicroSeconds_number,
		externCPUTime: 99921 as MicroSeconds_number,

		langInternalCPUEnergyConsumption: 19398 as MilliJoule_number,
		internCPUEnergyConsumption: 2490 as MilliJoule_number,
		externCPUEnergyConsumption: 199842 as MilliJoule_number,

		langInternalRAMEnergyConsumption: 19398 as MilliJoule_number,
		internRAMEnergyConsumption: 2490 as MilliJoule_number,
		externRAMEnergyConsumption: 199842 as MilliJoule_number
	},
	lang_internal: {
		8: {
			id: 8 as SourceNodeID_number,
			type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
			sensorValues: {
				selfCPUTime: 456,
				aggregatedCPUTime: 789,

				selfCPUEnergyConsumption: 912,
				aggregatedCPUEnergyConsumption: 1578,

				selfRAMEnergyConsumption: 912,
				aggregatedRAMEnergyConsumption: 1578
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
		10: {
			id: 10,
			type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
			sensorValues: {
				selfCPUTime: 567,
				aggregatedCPUTime: 8910,

				selfCPUEnergyConsumption: 1134,
				aggregatedCPUEnergyConsumption: 17820,

				selfRAMEnergyConsumption: 1134,
				aggregatedRAMEnergyConsumption: 17820
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
	},
	intern: {
		4: {
			id: 4,
			type: SourceNodeMetaDataType.InternSourceNodeReference,
			sensorValues: {
				selfCPUTime: 234,
				aggregatedCPUTime: 567,

				selfCPUEnergyConsumption: 468,
				aggregatedCPUEnergyConsumption: 1134,

				selfRAMEnergyConsumption: 468,
				aggregatedRAMEnergyConsumption: 1134
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
		5: {
			id: 5 as SourceNodeID_number,
			type: SourceNodeMetaDataType.InternSourceNodeReference,
			sensorValues: {
				selfCPUTime: 345,
				aggregatedCPUTime: 678,

				selfCPUEnergyConsumption: 690,
				aggregatedCPUEnergyConsumption: 1356,

				selfRAMEnergyConsumption: 690,
				aggregatedRAMEnergyConsumption: 1356
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
	},
	extern: {
		13: {
			id: 13 as SourceNodeID_number,
			type: SourceNodeMetaDataType.ExternSourceNodeReference,
			sensorValues: {
				selfCPUTime: 567,
				aggregatedCPUTime: 8910,

				selfCPUEnergyConsumption: 1134,
				aggregatedCPUEnergyConsumption: 17820,

				selfRAMEnergyConsumption: 1134,
				aggregatedRAMEnergyConsumption: 17820
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
		16: {
			id: 16 as SourceNodeID_number,
			type: SourceNodeMetaDataType.ExternSourceNodeReference,
			sensorValues: {
				selfCPUTime: 678,
				aggregatedCPUTime: 91011,

				selfCPUEnergyConsumption: 1356,
				aggregatedCPUEnergyConsumption: 182022,

				selfRAMEnergyConsumption: 1356,
				aggregatedRAMEnergyConsumption: 182022
			}
		} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
	}
} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>

const EXAMPLE_SOURCE_NODE_META_DATA_BUFFER =
	'020000000000000038e7dd04000051860100e3250000000000000074a34000000000106508410000000080f1d240000000000074a340000000001065084101000000000080f1d2400200000008000000020800000002000000c618c8010000150300000000000000808c400000000000a898400000000000808c400000000000a898400a000000020a00000002000000c61837020000ce2200000000000000b89140000000000067d1400000000000b89140000000000067d1400200000004000000020400000003000000c618ea000000370200000000000000407d400000000000b891400000000000407d400000000000b8914005000000020500000003000000c61859010000a60200000000000000908540000000000030954000000000009085400000000000309540020000000d000000020d00000004000000c61837020000ce2200000000000000b89140000000000067d1400000000000b89140000000000067d14010000000021000000004000000c618a6020000836301000000000000309540000000003038064100000000003095400000000030380641'

function runInstanceTests(
	title: string,
	preDefinedInstance: () => SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
) {
	let instance: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>

	describe(title, () => {
		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof SourceNodeMetaData', () => {
			expect(instance instanceof SourceNodeMetaData).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SourceNodeMetaData.fromJSON).toBeTruthy()
		})

		it('should have a static method merge()', () => {
			expect(SourceNodeMetaData.merge).toBeTruthy()
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_SOURCE_NODE_META_DATA)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toEqual(
				EXAMPLE_SOURCE_NODE_META_DATA_BUFFER
			)
		})

		test('presentInOriginalSourceCode', () => {
			// presentInOriginalSourceCode is directly derived from the sourceNodeIndex
			expect(instance.presentInOriginalSourceCode).toBe(true)
			instance.sourceNodeIndex.presentInOriginalSourceCode = false
			expect(instance.presentInOriginalSourceCode).toBe(false)
		})
	})
}

describe('SourceNodeMetaData', () => {
	runInstanceTests('instance related', () => {
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const sourceNodeIndex = globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)

		const instance = new SourceNodeMetaData(
			SourceNodeMetaDataType.SourceNode,
			sourceNodeIndex.id,
			new SensorValues({}),
			sourceNodeIndex
		)

		instance.addSensorValuesToIntern(
			new GlobalIdentifier(
				'./dist/examples/example001.js' as UnifiedPath_string,
				'{root}.{function:main}' as SourceNodeIdentifier_string
			),
			{
				// cpu time
				selfCPUTime: 234 as MicroSeconds_number,
				aggregatedCPUTime: 567 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 468 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 1134 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 468 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 1134 as MilliJoule_number
			}
		)
		instance.addSensorValuesToIntern(
			new GlobalIdentifier(
				'./dist/examples/example001.js' as UnifiedPath_string,
				'{root}.{function:logMessage}' as SourceNodeIdentifier_string
			),
			{
				// cpu time
				selfCPUTime: 345 as MicroSeconds_number,
				aggregatedCPUTime: 678 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 690 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 1356 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 690 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 1356 as MilliJoule_number
			}
		)

		instance.addSensorValuesToLangInternal(
			new GlobalIdentifier(
				'node:timers' as UnifiedPath_string,
				'{setTimeout}' as SourceNodeIdentifier_string
			),
			{
				// cpu time
				selfCPUTime: 456 as MicroSeconds_number,
				aggregatedCPUTime: 789 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 912 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 1578 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 912 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 1578 as MilliJoule_number
			}
		)
		instance.addSensorValuesToLangInternal(
			new GlobalIdentifier(
				'' as UnifiedPath_string,
				'{consoleCall}' as SourceNodeIdentifier_string
			),
			{
				// cpu time
				selfCPUTime: 567 as MicroSeconds_number,
				aggregatedCPUTime: 8910 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 1134 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 17820 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 1134 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 17820 as MilliJoule_number
			}
		)

		instance.addSensorValuesToExtern(
			new GlobalIdentifier(
				'./src/htmlminifier.js' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string,
				new NodeModule('html-minifier', '4.0.0')
			),
			{
				// cpu time
				selfCPUTime: 567 as MicroSeconds_number,
				aggregatedCPUTime: 8910 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 1134 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 17820 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 1134 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 17820 as MilliJoule_number
			}
		)
		instance.addSensorValuesToExtern(
			new GlobalIdentifier(
				'./lib/clean.js' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string,
				new NodeModule('clean-css', '4.2.4')
			),
			{
				// cpu time
				selfCPUTime: 678 as MicroSeconds_number,
				aggregatedCPUTime: 91011 as MicroSeconds_number,

				// cpu energy
				selfCPUEnergyConsumption: 1356 as MilliJoule_number,
				aggregatedCPUEnergyConsumption: 182022 as MilliJoule_number,

				// ram energy
				selfRAMEnergyConsumption: 1356 as MilliJoule_number,
				aggregatedRAMEnergyConsumption: 182022 as MilliJoule_number
			}
		)
		return instance
	})

	describe('deserialization', () => {
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getModuleIndex('upsert')
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)

		test('deserialization from string', () => {
			const instanceFromString = SourceNodeMetaData.fromJSON(
				JSON.stringify(EXAMPLE_SOURCE_NODE_META_DATA),
				globalIndex
			)
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_SOURCE_NODE_META_DATA)
		})

		test('deserialization from object', () => {
			const instanceFromObject = SourceNodeMetaData.fromJSON(
				EXAMPLE_SOURCE_NODE_META_DATA,
				globalIndex
			)
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_SOURCE_NODE_META_DATA)
		})

		runInstanceTests('deserialized instance related', () => {
			const instanceFromString =
				SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.SourceNode>(
					JSON.stringify(EXAMPLE_SOURCE_NODE_META_DATA),
					globalIndex
				)
			return instanceFromString
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_SOURCE_NODE_META_DATA_BUFFER, 'hex')
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		globalIndex.getModuleIndex('upsert')
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)
		globalIndex.getSourceNodeIndex(
			'upsert',
			GlobalIdentifier.fromIdentifier(
				'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
			)
		)

		test('consume from buffer', () => {
			const { instance, remainingBuffer } =
				SourceNodeMetaData.consumeFromBuffer(buffer, globalIndex)
			expect(instance.toJSON()).toEqual(EXAMPLE_SOURCE_NODE_META_DATA)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = SourceNodeMetaData.consumeFromBuffer(
				buffer,
				globalIndex
			)
			return instance as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
		})
	})

	describe('operators', () => {
		let instanceA: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
		let instanceB: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
		let instanceC: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>

		beforeEach(() => {
			instanceA = new SourceNodeMetaData(
				SourceNodeMetaDataType.Aggregate,
				undefined,
				new SensorValues({
					profilerHits: 1,

					selfCPUTime: 2 as MicroSeconds_number,
					aggregatedCPUTime: 3 as MicroSeconds_number,
					internCPUTime: 4 as MicroSeconds_number,
					externCPUTime: 5 as MicroSeconds_number,
					langInternalCPUTime: 6 as MicroSeconds_number,

					selfCPUEnergyConsumption: 6 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 6 as MilliJoule_number,
					internCPUEnergyConsumption: 8 as MilliJoule_number,
					externCPUEnergyConsumption: 10 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 12 as MilliJoule_number,

					selfRAMEnergyConsumption: 6 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 6 as MilliJoule_number,
					internRAMEnergyConsumption: 8 as MilliJoule_number,
					externRAMEnergyConsumption: 10 as MilliJoule_number,
					langInternalRAMEnergyConsumption: 12 as MilliJoule_number
				}),
				undefined
			)
			instanceB = new SourceNodeMetaData(
				SourceNodeMetaDataType.Aggregate,
				undefined,
				new SensorValues({
					profilerHits: 7,

					selfCPUTime: 8 as MicroSeconds_number,
					aggregatedCPUTime: 9 as MicroSeconds_number,
					internCPUTime: 10 as MicroSeconds_number,
					externCPUTime: 11 as MicroSeconds_number,
					langInternalCPUTime: 12 as MicroSeconds_number,

					selfCPUEnergyConsumption: 16 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 18 as MilliJoule_number,
					internCPUEnergyConsumption: 20 as MilliJoule_number,
					externCPUEnergyConsumption: 22 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 24 as MilliJoule_number,

					selfRAMEnergyConsumption: 16 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 18 as MilliJoule_number,
					internRAMEnergyConsumption: 20 as MilliJoule_number,
					externRAMEnergyConsumption: 22 as MilliJoule_number,
					langInternalRAMEnergyConsumption: 24 as MilliJoule_number
				}),
				undefined
			)
			instanceC = new SourceNodeMetaData(
				SourceNodeMetaDataType.Aggregate,
				undefined,
				new SensorValues({
					profilerHits: 13,

					selfCPUTime: 14 as MicroSeconds_number,
					aggregatedCPUTime: 15 as MicroSeconds_number,
					internCPUTime: 16 as MicroSeconds_number,
					externCPUTime: 17 as MicroSeconds_number,
					langInternalCPUTime: 18 as MicroSeconds_number,

					selfCPUEnergyConsumption: 28 as MilliJoule_number,
					aggregatedCPUEnergyConsumption: 30 as MilliJoule_number,
					internCPUEnergyConsumption: 32 as MilliJoule_number,
					externCPUEnergyConsumption: 34 as MilliJoule_number,
					langInternalCPUEnergyConsumption: 36 as MilliJoule_number,

					selfRAMEnergyConsumption: 28 as MilliJoule_number,
					aggregatedRAMEnergyConsumption: 30 as MilliJoule_number,
					internRAMEnergyConsumption: 32 as MilliJoule_number,
					externRAMEnergyConsumption: 34 as MilliJoule_number,
					langInternalRAMEnergyConsumption: 36 as MilliJoule_number
				}),
				undefined
			)
		})

		test('max', () => {
			const max = SourceNodeMetaData.max(instanceA, instanceB, instanceC)

			expect(max.type).toBe(SourceNodeMetaDataType.Aggregate)
		})

		test('sum', () => {
			const sum = SourceNodeMetaData.sum(instanceA, instanceB, instanceC)

			expect(sum.type).toBe(SourceNodeMetaDataType.Aggregate)
		})

		test('equal', () => {
			expect(SourceNodeMetaData.equals(instanceA, instanceB)).toBe(false)
			expect(SourceNodeMetaData.equals(instanceA, instanceC)).toBe(false)
			expect(SourceNodeMetaData.equals(instanceB, instanceC)).toBe(false)

			expect(SourceNodeMetaData.equals(instanceA, instanceA)).toBe(true)
			expect(SourceNodeMetaData.equals(instanceB, instanceB)).toBe(true)
			expect(SourceNodeMetaData.equals(instanceC, instanceC)).toBe(true)
		})
	})

	describe('merging', () => {
		let instancesToMerge: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>[]
		beforeEach(() => {
			const firstGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			firstGlobalIndex.getModuleIndex('upsert')
			const firstSourceNodeIndex = firstGlobalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)

			const first =
				SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.SourceNode>(
					{
						id: firstSourceNodeIndex.id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							langInternalCPUTime: 9699,
							internCPUTime: 1245,
							externCPUTime: 17820,

							langInternalCPUEnergyConsumption: 19398,
							internCPUEnergyConsumption: 2490,
							externCPUEnergyConsumption: 35640,

							langInternalRAMEnergyConsumption: 19398,
							internRAMEnergyConsumption: 2490,
							externRAMEnergyConsumption: 35640
						},
						lang_internal: {
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 456,
									aggregatedCPUTime: 789,

									selfCPUEnergyConsumption: 912,
									aggregatedCPUEnergyConsumption: 1578,

									selfRAMEnergyConsumption: 912,
									aggregatedRAMEnergyConsumption: 1578
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						>,
						intern: {
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 234,
									aggregatedCPUTime: 567,

									selfCPUEnergyConsumption: 468,
									aggregatedCPUEnergyConsumption: 1134,

									selfRAMEnergyConsumption: 468,
									aggregatedRAMEnergyConsumption: 1134
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 345,
									aggregatedCPUTime: 678,

									selfCPUEnergyConsumption: 690,
									aggregatedCPUEnergyConsumption: 1356,

									selfRAMEnergyConsumption: 690,
									aggregatedRAMEnergyConsumption: 1356
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						>,
						extern: {
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
							[firstGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: firstGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						>
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					firstGlobalIndex
				)

			const secondGlobalIndex = new GlobalIndex(
				NodeModule.currentEngineModule()
			)
			secondGlobalIndex.getModuleIndex('upsert')
			const secondSourceNodeIndex = secondGlobalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)

			const second =
				SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.SourceNode>(
					{
						id: secondSourceNodeIndex.id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							langInternalCPUTime: 91800,
							internCPUTime: 1356,
							externCPUTime: 99921,

							langInternalCPUEnergyConsumption: 183600 as MilliJoule_number,
							internCPUEnergyConsumption: 2712 as MilliJoule_number,
							externCPUEnergyConsumption: 199842 as MilliJoule_number,

							langInternalRAMEnergyConsumption: 183600 as MilliJoule_number,
							internRAMEnergyConsumption: 2712 as MilliJoule_number,
							externRAMEnergyConsumption: 199842 as MilliJoule_number
						},
						lang_internal: {
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{node:timers}{setTimeout2}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{node:timers}{setTimeout2}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 456,
									aggregatedCPUTime: 789,

									selfCPUEnergyConsumption: 912,
									aggregatedCPUEnergyConsumption: 1578,

									selfRAMEnergyConsumption: 912,
									aggregatedRAMEnergyConsumption: 1578
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 678,
									aggregatedCPUTime: 91011,

									selfCPUEnergyConsumption: 1356,
									aggregatedCPUEnergyConsumption: 182022,

									selfRAMEnergyConsumption: 1356,
									aggregatedRAMEnergyConsumption: 182022
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						>,
						intern: {
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 345,
									aggregatedCPUTime: 678,

									selfCPUEnergyConsumption: 690,
									aggregatedCPUEnergyConsumption: 1356,

									selfRAMEnergyConsumption: 690,
									aggregatedRAMEnergyConsumption: 1356
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example001.js}{root}.{function:logMessage2}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example001.js}{root}.{function:logMessage2}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 345,
									aggregatedCPUTime: 678,

									selfCPUEnergyConsumption: 690,
									aggregatedCPUEnergyConsumption: 1356,

									selfRAMEnergyConsumption: 690,
									aggregatedRAMEnergyConsumption: 1356
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						>,
						extern: {
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'html-minifier@4.0.0{./src/htmlminifier2.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'html-minifier@4.0.0{./src/htmlminifier2.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
							[secondGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: secondGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 678,
									aggregatedCPUTime: 91011,

									selfCPUEnergyConsumption: 1356,
									aggregatedCPUEnergyConsumption: 182022,

									selfRAMEnergyConsumption: 1356,
									aggregatedRAMEnergyConsumption: 182022
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						>
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					secondGlobalIndex
				)

			const thirdGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			thirdGlobalIndex.getModuleIndex('upsert')
			const thirdSourceNodeIndex = thirdGlobalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)

			const third =
				SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.SourceNode>(
					{
						id: thirdSourceNodeIndex.id,
						type: SourceNodeMetaDataType.SourceNode,
						sensorValues: {
							langInternalCPUTime: 9699,
							internCPUTime: 1245,
							externCPUTime: 17820,

							langInternalCPUEnergyConsumption: 19398 as MilliJoule_number,
							internCPUEnergyConsumption: 2490 as MilliJoule_number,
							externCPUEnergyConsumption: 35640 as MilliJoule_number,

							langInternalRAMEnergyConsumption: 19398 as MilliJoule_number,
							internRAMEnergyConsumption: 2490 as MilliJoule_number,
							externRAMEnergyConsumption: 35640 as MilliJoule_number
						},
						lang_internal: {
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{node:timers}{anotherSetTimeout}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{node:timers}{anotherSetTimeout}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 456,
									aggregatedCPUTime: 789,

									selfCPUEnergyConsumption: 912,
									aggregatedCPUEnergyConsumption: 1578,

									selfRAMEnergyConsumption: 912,
									aggregatedRAMEnergyConsumption: 1578
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{}{anotherConsoleCall}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{}{anotherConsoleCall}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
						>,
						intern: {
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example002.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example002.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 234,
									aggregatedCPUTime: 567,

									selfCPUEnergyConsumption: 468,
									aggregatedCPUEnergyConsumption: 1134,

									selfRAMEnergyConsumption: 468,
									aggregatedRAMEnergyConsumption: 1134
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'{./dist/examples/example002.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'{./dist/examples/example002.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.InternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 345,
									aggregatedCPUTime: 678,

									selfCPUEnergyConsumption: 690,
									aggregatedCPUEnergyConsumption: 1356,

									selfRAMEnergyConsumption: 690,
									aggregatedRAMEnergyConsumption: 1356
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
						>,
						extern: {
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'html-minifier2@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'html-minifier2@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
							[thirdGlobalIndex.getSourceNodeIndex(
								'upsert',
								GlobalIdentifier.fromIdentifier(
									'clean-css2@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
								)
							).id]: {
								id: thirdGlobalIndex.getSourceNodeIndex(
									'upsert',
									GlobalIdentifier.fromIdentifier(
										'clean-css2@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
									)
								).id,
								type: SourceNodeMetaDataType.ExternSourceNodeReference,
								sensorValues: {
									profilerHits: 1,

									selfCPUTime: 567,
									aggregatedCPUTime: 8910,

									selfCPUEnergyConsumption: 1134,
									aggregatedCPUEnergyConsumption: 17820,

									selfRAMEnergyConsumption: 1134,
									aggregatedRAMEnergyConsumption: 17820
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						} as Record<
							GlobalSourceNodeIdentifier_string,
							ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
						>
					} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>,
					thirdGlobalIndex
				)

			instancesToMerge = [first, second, third]
		})

		test('empty arguments', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const sourceNodeIndex = globalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)
			const t = () => {
				SourceNodeMetaData.merge(sourceNodeIndex.id, sourceNodeIndex, ...[])
			}

			expect(t).toThrow(
				'SourceNodeMetaData.merge: no SourceNodeMetaData were given'
			)
		})

		test('wrong types', () => {
			;(
				instancesToMerge[0] as unknown as SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
			).type = SourceNodeMetaDataType.Aggregate

			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			globalIndex.getModuleIndex('upsert')
			const sourceNodeIndex = globalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)
			const t = () => {
				SourceNodeMetaData.merge(
					sourceNodeIndex.id,
					sourceNodeIndex,
					...instancesToMerge
				)
			}

			expect(t).toThrow(
				'SourceNodeMetaData.merge: all SourceNodeMetaDatas should be from the same type.'
			)
		})

		test('merges correctly', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			globalIndex.getModuleIndex('upsert')
			const sourceNodeIndex = globalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(
					'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
				)
			)

			const mergeResult = SourceNodeMetaData.merge(
				sourceNodeIndex.id,
				sourceNodeIndex,
				...instancesToMerge
			)

			expect(mergeResult.toJSON()).toEqual({
				id: sourceNodeIndex.id,
				type: SourceNodeMetaDataType.SourceNode,
				sensorValues: {
					langInternalCPUTime: 111198,
					internCPUTime: 3846,
					externCPUTime: 135561,

					langInternalCPUEnergyConsumption: 222396 as MilliJoule_number,
					internCPUEnergyConsumption: 7692 as MilliJoule_number,
					externCPUEnergyConsumption: 271122 as MilliJoule_number,

					langInternalRAMEnergyConsumption: 222396 as MilliJoule_number,
					internRAMEnergyConsumption: 7692 as MilliJoule_number,
					externRAMEnergyConsumption: 271122 as MilliJoule_number
				},
				lang_internal: {
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{node:timers}{setTimeout}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 456,
							aggregatedCPUTime: 789,

							selfCPUEnergyConsumption: 912,
							aggregatedCPUEnergyConsumption: 1578,

							selfRAMEnergyConsumption: 912,
							aggregatedRAMEnergyConsumption: 1578
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{}{consoleCall}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
						sensorValues: {
							profilerHits: 2,

							selfCPUTime: 1245,
							aggregatedCPUTime: 99921,

							selfCPUEnergyConsumption: 2490,
							aggregatedCPUEnergyConsumption: 199842,

							selfRAMEnergyConsumption: 2490,
							aggregatedRAMEnergyConsumption: 199842
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{node:timers}{setTimeout2}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{node:timers}{setTimeout2}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 456,
							aggregatedCPUTime: 789,

							selfCPUEnergyConsumption: 912,
							aggregatedCPUEnergyConsumption: 1578,

							selfRAMEnergyConsumption: 912,
							aggregatedRAMEnergyConsumption: 1578
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{node:timers}{anotherSetTimeout}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{node:timers}{anotherSetTimeout}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 456,
							aggregatedCPUTime: 789,

							selfCPUEnergyConsumption: 912,
							aggregatedCPUEnergyConsumption: 1578,

							selfRAMEnergyConsumption: 912,
							aggregatedRAMEnergyConsumption: 1578
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{}{anotherConsoleCall}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{}{anotherConsoleCall}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.LangInternalSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 567,
							aggregatedCPUTime: 8910,

							selfCPUEnergyConsumption: 1134,
							aggregatedCPUEnergyConsumption: 17820,

							selfRAMEnergyConsumption: 1134,
							aggregatedRAMEnergyConsumption: 17820
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
				},
				intern: {
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{./dist/examples/example001.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.InternSourceNodeReference,
						sensorValues: {
							profilerHits: 2,

							selfCPUTime: 579,
							aggregatedCPUTime: 1245,

							selfCPUEnergyConsumption: 1158,
							aggregatedCPUEnergyConsumption: 2490,

							selfRAMEnergyConsumption: 1158,
							aggregatedRAMEnergyConsumption: 2490
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{./dist/examples/example001.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.InternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 345,
							aggregatedCPUTime: 678,

							selfCPUEnergyConsumption: 690,
							aggregatedCPUEnergyConsumption: 1356,

							selfRAMEnergyConsumption: 690,
							aggregatedRAMEnergyConsumption: 1356
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{./dist/examples/example001.js}{root}.{function:logMessage2}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{./dist/examples/example001.js}{root}.{function:logMessage2}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.InternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 345,
							aggregatedCPUTime: 678,

							selfCPUEnergyConsumption: 690,
							aggregatedCPUEnergyConsumption: 1356,

							selfRAMEnergyConsumption: 690,
							aggregatedRAMEnergyConsumption: 1356
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{./dist/examples/example002.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{./dist/examples/example002.js}{root}.{function:main}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.InternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 234,
							aggregatedCPUTime: 567,

							selfCPUEnergyConsumption: 468,
							aggregatedCPUEnergyConsumption: 1134,

							selfRAMEnergyConsumption: 468,
							aggregatedRAMEnergyConsumption: 1134
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'{./dist/examples/example002.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'{./dist/examples/example002.js}{root}.{function:logMessage}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.InternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 345,
							aggregatedCPUTime: 678,

							selfCPUEnergyConsumption: 690,
							aggregatedCPUEnergyConsumption: 1356,

							selfRAMEnergyConsumption: 690,
							aggregatedRAMEnergyConsumption: 1356
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
				},
				extern: {
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'html-minifier@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.ExternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 567,
							aggregatedCPUTime: 8910,

							selfCPUEnergyConsumption: 1134,
							aggregatedCPUEnergyConsumption: 17820,

							selfRAMEnergyConsumption: 1134,
							aggregatedRAMEnergyConsumption: 17820
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'clean-css@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.ExternSourceNodeReference,
						sensorValues: {
							profilerHits: 2,

							selfCPUTime: 1245,
							aggregatedCPUTime: 99921,

							selfCPUEnergyConsumption: 2490,
							aggregatedCPUEnergyConsumption: 199842,

							selfRAMEnergyConsumption: 2490,
							aggregatedRAMEnergyConsumption: 199842
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'html-minifier@4.0.0{./src/htmlminifier2.js}{root}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'html-minifier@4.0.0{./src/htmlminifier2.js}{root}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.ExternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 567,
							aggregatedCPUTime: 8910,

							selfCPUEnergyConsumption: 1134,
							aggregatedCPUEnergyConsumption: 17820,

							selfRAMEnergyConsumption: 1134,
							aggregatedRAMEnergyConsumption: 17820
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'html-minifier2@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'html-minifier2@4.0.0{./src/htmlminifier.js}{root}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.ExternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 567,
							aggregatedCPUTime: 8910,

							selfCPUEnergyConsumption: 1134,
							aggregatedCPUEnergyConsumption: 17820,

							selfRAMEnergyConsumption: 1134,
							aggregatedRAMEnergyConsumption: 17820
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>,
					[globalIndex.getSourceNodeIndex(
						'get',
						GlobalIdentifier.fromIdentifier(
							'clean-css2@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
						)
					)!.id]: {
						id: globalIndex.getSourceNodeIndex(
							'get',
							GlobalIdentifier.fromIdentifier(
								'clean-css2@4.2.4{./lib/clean.js}{root}' as GlobalSourceNodeIdentifier_string
							)
						)!.id,
						type: SourceNodeMetaDataType.ExternSourceNodeReference,
						sensorValues: {
							profilerHits: 1,

							selfCPUTime: 567,
							aggregatedCPUTime: 8910,

							selfCPUEnergyConsumption: 1134,
							aggregatedCPUEnergyConsumption: 17820,

							selfRAMEnergyConsumption: 1134,
							aggregatedRAMEnergyConsumption: 17820
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
				}
			} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>)
		})

		describe('merges presentInOriginalSourceCode correctly', () => {
			test('one is false', () => {
				instancesToMerge[0].presentInOriginalSourceCode = true
				instancesToMerge[1].presentInOriginalSourceCode = false
				instancesToMerge[2].presentInOriginalSourceCode = true

				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				globalIndex.getModuleIndex('upsert')
				const sourceNodeIndex = globalIndex.getSourceNodeIndex(
					'upsert',
					GlobalIdentifier.fromIdentifier(
						'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
					)
				)

				const mergeResult = SourceNodeMetaData.merge(
					sourceNodeIndex.id,
					sourceNodeIndex,
					...instancesToMerge
				)

				expect(mergeResult.presentInOriginalSourceCode).toBe(false)
			})

			test('all true', () => {
				instancesToMerge[0].presentInOriginalSourceCode = true
				instancesToMerge[1].presentInOriginalSourceCode = true
				instancesToMerge[2].presentInOriginalSourceCode = true

				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				globalIndex.getModuleIndex('upsert')
				const sourceNodeIndex = globalIndex.getSourceNodeIndex(
					'upsert',
					GlobalIdentifier.fromIdentifier(
						'{./dist/index.js}{root}' as GlobalSourceNodeIdentifier_string
					)
				)

				const mergeResult = SourceNodeMetaData.merge(
					sourceNodeIndex.id,
					sourceNodeIndex,
					...instancesToMerge
				)

				expect(mergeResult.presentInOriginalSourceCode).toBe(true)
			})
		})
	})
})
