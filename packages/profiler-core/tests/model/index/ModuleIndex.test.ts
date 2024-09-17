import { NodeModule } from '../../../src/model/NodeModule'
import { GlobalIndex } from '../../../src/model/index/GlobalIndex'
import { ModuleIndex } from '../../../src/model/index/ModuleIndex'
import {
	NodeModuleIdentifier_string,
	UnifiedPath_string,
	IndexRequestType,
	IModuleIndex,
	ModuleID_number,
	PathID_number
} from '../../../src/types'

const EXAMPLE_MODULE_INDEX: IModuleIndex = {
	id: 0 as ModuleID_number,
	children: {
		'packages': {
			children: {
				'profiler-core': {
					children: {
						'src': {
							children: {
								'model': {
									children: {
										'index': {
											children: {
												'GlobalIndex.ts': {
													id: 1 as PathID_number
												}
											}
										},
										'helper': {
											children: {
												'CPUModel.ts': {
													id: 2 as PathID_number
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function runInstanceTests(title: string, preDefinedInstance: () => ModuleIndex) {
	describe(title, () => {
		let instance: ModuleIndex

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		test('get on non existing path', () => {
			expect(
				instance.getFilePathIndex('get', './abc/def' as UnifiedPath_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getFilePathIndex('xyz' as IndexRequestType, './abc/def' as UnifiedPath_string)
			).toBeUndefined()
		})

		test('get on half existing path', () => {
			expect(
				instance.getFilePathIndex('get', './packages/profiler-core/abc' as UnifiedPath_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getFilePathIndex('xyz' as IndexRequestType, './packages/profiler-core/abc' as UnifiedPath_string)
			).toBeUndefined()
		})

		test('get on longer existing path', () => {
			expect(
				instance.getFilePathIndex('get', './packages/profiler-core/src/model/helper/CPUModel.ts/abc' as UnifiedPath_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getFilePathIndex('xyz' as IndexRequestType, './packages/profiler-core/src/model/helper/CPUModel.ts/abc' as UnifiedPath_string)
			).toBeUndefined()
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODULE_INDEX)
		})

		test('pathMap', () => {
			expect(instance.pathMap.toJSON()).toEqual({
				'./packages/profiler-core/src/model/index/GlobalIndex.ts': {
					id: 1
				},
				'./packages/profiler-core/src/model/helper/CPUModel.ts': {
					id: 2
				}
			})
		})
	})
}

describe('ModuleIndex', () => {
	runInstanceTests('instance related', () => {
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const instance = globalIndex.getModuleIndex('upsert')
		instance.getFilePathIndex('upsert', './packages/profiler-core/src/model/index/GlobalIndex.ts' as UnifiedPath_string)
		instance.getFilePathIndex('upsert', './packages/profiler-core/src/model/helper/CPUModel.ts' as UnifiedPath_string)

		return instance
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())

			const reportFromString = ModuleIndex.fromJSON(JSON.stringify(EXAMPLE_MODULE_INDEX), '{self}' as NodeModuleIdentifier_string, globalIndex)
			expect(reportFromString.toJSON()).toEqual(EXAMPLE_MODULE_INDEX)
		})

		test('deserialization from object', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())

			const reportFromObject = ModuleIndex.fromJSON(EXAMPLE_MODULE_INDEX, '{self}' as NodeModuleIdentifier_string, globalIndex)
			expect(reportFromObject.toJSON()).toEqual(EXAMPLE_MODULE_INDEX)
		})

		runInstanceTests('deserialized instance related', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())

			const reportFromString = ModuleIndex.fromJSON(JSON.stringify(EXAMPLE_MODULE_INDEX), '{self}' as NodeModuleIdentifier_string, globalIndex)
			return reportFromString
		})
	})
})