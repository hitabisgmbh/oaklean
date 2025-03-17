import { GlobalIndex } from '../../../src/model/indices/GlobalIndex'
import { PathIndex } from '../../../src/model/indices/PathIndex'
import { ModuleIndex } from '../../../src/model/indices/ModuleIndex'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { NodeModule } from '../../../src/model/NodeModule'
import {
	IndexRequestType,
	IPathIndex,
	PathID_number,
	UnifiedPath_string,
	SourceNodeIdentifier_string,
	SourceNodeID_number
} from '../../../src/types'

const EXAMPLE_PATH_INDEX: IPathIndex = {
	id: 1 as PathID_number,
	file: {
		'{root}': {
			id: undefined,
			children: {
				'{class:GlobalIndex}': {
					id: undefined,
					children: {
						'{constructor:constructor}': {
							id: 2 as SourceNodeID_number
						},
						'{method:toJSON}': {
							id: 3 as SourceNodeID_number
						},
						'{method:getModuleIndex}': {
							id: 4 as SourceNodeID_number
						}
					}
				}
			}
		}
	}
}

function runInstanceTests(title: string, preDefinedInstance: () => PathIndex) {
	describe(title, () => {
		let instance: PathIndex
		beforeEach(() => {
			instance = preDefinedInstance()
		})

		test('get on non existing sourceNodeIdentifier', () => {
			expect(
				instance.getSourceNodeIndex('get', '{root}.{class:ABC}' as SourceNodeIdentifier_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getSourceNodeIndex('xyz' as IndexRequestType, '{root}' as SourceNodeIdentifier_string)
			).toBeUndefined()
		})

		describe('RegExp', () => {
			test('get on non existing sourceNodeIdentifier', () => {
				expect(
					instance.getSourceNodeIndex('get', 'RegExp: ^node:(?:[^\\/{}]*)(?:\\/[^\\/{}]*)*$' as SourceNodeIdentifier_string)
				).toBeUndefined()

				// check non existing request type
				expect(
					instance.getSourceNodeIndex('xyz' as IndexRequestType, 'RegExp: ^node:(?:[^\\/{}]*)(?:\\/[^\\/{}]*)*$' as SourceNodeIdentifier_string)
				).toBeUndefined()
			})
		})

		test('get on half existing sourceNodeIdentifier', () => {
			expect(
				instance.getSourceNodeIndex('get', '{root}.{class:GlobalIndex}.{method:getModuleIndex}.{function:abc}' as SourceNodeIdentifier_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getSourceNodeIndex('xyz' as IndexRequestType, '{root}.{class:GlobalIndex}.{method:getModuleIndex}.{function:abc}' as SourceNodeIdentifier_string)
			).toBeUndefined()
		})

		test('get on longer existing sourceNodeIdentifier', () => {
			instance.getSourceNodeIndex('upsert', '{root}.{class:UnifiedPath}.{method:pathUntilSubDir}' as SourceNodeIdentifier_string)

			expect(
				instance.getSourceNodeIndex('get', '{root}.{class:GlobalIndex}' as SourceNodeIdentifier_string)
			).toBeUndefined()

			// check non existing request type
			expect(
				instance.getSourceNodeIndex('xyz' as IndexRequestType, '{root}.{class:GlobalIndex}' as SourceNodeIdentifier_string)
			).toBeUndefined()
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_PATH_INDEX)
		})

		test('containsUncommittedChanges', () => {
			expect(instance.containsUncommittedChanges).toBe(false)
			expect(instance.toJSON()).toEqual({
				...EXAMPLE_PATH_INDEX,
				cucc: undefined
			})
			instance.containsUncommittedChanges = true
			expect(instance.toJSON()).toEqual({
				...EXAMPLE_PATH_INDEX,
				cucc: true
			})
			instance.containsUncommittedChanges = false
		})

		test('sourceNodeMap', () => {
			expect(instance.sourceNodeMap.toJSON()).toEqual({
				'{root}.{class:GlobalIndex}.{constructor:constructor}': { id: 2 },
				'{root}.{class:GlobalIndex}.{method:toJSON}': { id: 3 },
				'{root}.{class:GlobalIndex}.{method:getModuleIndex}': { id: 4 }
			})
		})
	})
}

describe('PathIndex', () => {
	runInstanceTests('instance related', () => {
		const globalIndex: GlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const moduleIndex: ModuleIndex = globalIndex.getModuleIndex('upsert')
		const instance: PathIndex = moduleIndex.getFilePathIndex('upsert', './abc/def' as UnifiedPath_string)

		instance.getSourceNodeIndex('upsert', '{root}.{class:GlobalIndex}.{constructor:constructor}' as SourceNodeIdentifier_string)
		instance.getSourceNodeIndex('upsert', '{root}.{class:GlobalIndex}.{method:toJSON}' as SourceNodeIdentifier_string)
		instance.getSourceNodeIndex('upsert', '{root}.{class:GlobalIndex}.{method:getModuleIndex}' as SourceNodeIdentifier_string)

		return instance
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const globalIndex: GlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex: ModuleIndex = globalIndex.getModuleIndex('upsert')
			const path = new UnifiedPath('./abc/def')

			const reportFromString = PathIndex.fromJSON(JSON.stringify(EXAMPLE_PATH_INDEX), path.split(), moduleIndex)
			expect(reportFromString.toJSON()).toEqual(EXAMPLE_PATH_INDEX)
		})

		test('deserialization from object', () => {
			const globalIndex: GlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex: ModuleIndex = globalIndex.getModuleIndex('upsert')
			const path = new UnifiedPath('./abc/def')

			const reportFromObject = PathIndex.fromJSON(EXAMPLE_PATH_INDEX, path.split(), moduleIndex)
			expect(reportFromObject.toJSON()).toEqual(EXAMPLE_PATH_INDEX)
		})

		runInstanceTests('deserialized instance related', () => {
			const globalIndex: GlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex: ModuleIndex = globalIndex.getModuleIndex('upsert')
			const path = new UnifiedPath('./abc/def')

			const reportFromString = PathIndex.fromJSON(JSON.stringify(EXAMPLE_PATH_INDEX), path.split(), moduleIndex)
			return reportFromString
		})
	})
})