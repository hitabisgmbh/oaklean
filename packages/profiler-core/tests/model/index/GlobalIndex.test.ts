import * as fs from 'fs'

import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { GlobalIndex } from '../../../src/model/indices/GlobalIndex'
import { GlobalIdentifier } from '../../../src/system/GlobalIdentifier'
import { NodeModule } from '../../../src/model/NodeModule'
import {
	UnifiedPath_string,
	NodeModuleIdentifier_string,
	ModuleID_number,
	PathID_number,
	SourceNodeID_number,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string
} from '../../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)

const EXPECTED_INDEX = JSON.parse(fs.readFileSync(CURRENT_DIR.join('assets', 'index.json').toString()).toString())

const EXPECTED_INDEX_MAP = JSON.parse(
	fs.readFileSync(CURRENT_DIR.join('assets', 'indexMap.json').toString()).toString()
)

const TEST_IDENTIFIERS: GlobalIdentifier[] = JSON.parse(
	fs.readFileSync(CURRENT_DIR.join('assets', 'identifiers.json').toString()).toString()
).map((identifier: GlobalSourceNodeIdentifier_string) => GlobalIdentifier.fromIdentifier(identifier))

const TEST_UNIQUE_MODULE_IDENTIFIERS = [
	...new Set(
		TEST_IDENTIFIERS.map((identifier: GlobalIdentifier) => {
			if (identifier.nodeModule) {
				return identifier.nodeModule.identifier
			}
		})
	)
].filter((identifier) => identifier !== undefined)

function runInstanceTests(title: string, preDefinedInstance: GlobalIndex) {
	describe(title, () => {
		let instance: GlobalIndex

		beforeEach(() => {
			instance = preDefinedInstance
		})

		it('should serialize correctly', () => {
			expect(instance.toJSON()).toEqual(EXPECTED_INDEX)
		})

		it('should generate the expected index', () => {
			expect(JSON.stringify(instance, null, 2)).toEqual(JSON.stringify(EXPECTED_INDEX, null, 2))
		})

		it('should generate the correct indexMap', () => {
			for (const [key, value] of instance.moduleReverseIndex.entries()) {
				expect(value.identifier).toBe(EXPECTED_INDEX_MAP.moduleReverseIndex[key])
			}

			for (const [key, value] of instance.pathReverseIndex.entries()) {
				expect(value.identifier).toBe(EXPECTED_INDEX_MAP.pathReverseIndex[key])
			}

			for (const [key, value] of instance.sourceNodeReverseIndex.entries()) {
				expect(value.identifier).toBe(EXPECTED_INDEX_MAP.sourceNodeReverseIndex[key])
			}
		})

		it('should return the correct indices via the get(Index)ByID methods', () => {
			for (const key of Object.keys(EXPECTED_INDEX_MAP.moduleReverseIndex)) {
				expect(instance.getModuleIndexByID(parseInt(key) as ModuleID_number)?.identifier).toBe(
					EXPECTED_INDEX_MAP.moduleReverseIndex[key]
				)
			}

			for (const key of Object.keys(EXPECTED_INDEX_MAP.pathReverseIndex)) {
				expect(instance.getPathIndexByID(parseInt(key) as PathID_number)?.identifier).toBe(
					EXPECTED_INDEX_MAP.pathReverseIndex[key]
				)
			}

			for (const key of Object.keys(EXPECTED_INDEX_MAP.sourceNodeReverseIndex)) {
				expect(instance.getSourceNodeIndexByID(parseInt(key) as SourceNodeID_number)?.identifier).toBe(
					EXPECTED_INDEX_MAP.sourceNodeReverseIndex[key]
				)
			}
		})

		it('should stay the same after multiple equal inserts', () => {
			const backup = JSON.stringify(instance, null, 2)
			TEST_IDENTIFIERS.map((identifier: GlobalIdentifier) => instance.getSourceNodeIndex('upsert', identifier))

			expect(JSON.stringify(instance, null, 2)).toBe(backup)
		})

		it('contains a unique id for each (unique) global identifier', () => {
			const ids: number[] = []

			for (const identifier of TEST_IDENTIFIERS) {
				const index = instance.getSourceNodeIndex('get', identifier)

				const id = index?.id
				expect(id).toBeDefined()
				if (id !== undefined) {
					expect(ids.includes(id)).toBe(false)
					ids.push(id)
				}
			}
		})

		it('contains a unique id for each (unique) node module identifier', () => {
			const ids: number[] = []

			for (const identifier of TEST_UNIQUE_MODULE_IDENTIFIERS) {
				const index = instance.getModuleIndex('get', identifier)

				const id = index?.id
				expect(id).toBeDefined()
				if (id !== undefined) {
					expect(ids.includes(id)).toBe(false)
					ids.push(id)
				}
			}
		})
	})
}

describe('GlobalIndex', () => {
	const instance = new GlobalIndex(NodeModule.currentEngineModule())
	TEST_IDENTIFIERS.map((identifier: GlobalIdentifier) => instance.getSourceNodeIndex('upsert', identifier))
	runInstanceTests('instance related', instance)

	describe('get and upsert', () => {
		let instance: GlobalIndex

		beforeEach(() => {
			instance = new GlobalIndex(NodeModule.currentEngineModule())
		})

		test('get on empty instance', () => {
			const globalIdentifier = new GlobalIdentifier(
				'./abc/def' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string
			)

			expect(instance.currentId).toBe(0)

			expect(instance.getModuleIndex('get')).toBeUndefined()
			expect(instance.getModuleIndex('get', 'expect@29.5.0' as NodeModuleIdentifier_string)).toBeUndefined()
			expect(instance.getLangInternalIndex('get')).toBeUndefined()
			expect(instance.getSourceNodeIndex('get', globalIdentifier)).toBeUndefined()
			expect(instance.currentId).toBe(0)
		})

		test('upsert on empty instance', () => {
			const globalIdentifier = new GlobalIdentifier(
				'./abc/def' as UnifiedPath_string,
				'{root}' as SourceNodeIdentifier_string
			)

			expect(instance.currentId).toBe(0)

			const id0 = instance.getModuleIndex('upsert')?.id
			expect(id0 !== undefined && id0 > -1).toBeTruthy()
			const id1 = instance.getModuleIndex('upsert', 'expect@29.5.0' as NodeModuleIdentifier_string)?.id
			expect(id1 !== undefined && id1 > -1).toBeTruthy()
			const id2 = instance.getLangInternalIndex('upsert')?.id
			expect(id2 !== undefined && id2 > -1).toBeTruthy()
			const id3 = instance.getSourceNodeIndex('upsert', globalIdentifier)?.id
			expect(id3 !== undefined && id3 > -1).toBeTruthy()

			expect(instance.currentId).toBe(5)

			// check that get returns the values that were previously upsert
			const get_id0 = instance.getModuleIndex('get')?.id
			expect(id0 === get_id0).toBeTruthy()
			const get_id1 = instance.getModuleIndex('get', 'expect@29.5.0' as NodeModuleIdentifier_string)?.id
			expect(id1 === get_id1).toBeTruthy()
			const get_id2 = instance.getLangInternalIndex('get')?.id
			expect(id2 === get_id2).toBeTruthy()
			const get_id3 = instance.getSourceNodeIndex('get', globalIdentifier)?.id
			expect(id3 === get_id3).toBeTruthy()

			expect(instance.currentId).toBe(5)
		})
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = GlobalIndex.fromJSON(JSON.stringify(EXPECTED_INDEX), NodeModule.currentEngineModule())
			expect(instanceFromString.toJSON()).toEqual(EXPECTED_INDEX)

			// check wether it stays the same after inserting the same entries
			TEST_IDENTIFIERS.map((identifier: GlobalIdentifier) =>
				instanceFromString.getSourceNodeIndex('upsert', identifier)
			)
			expect(instanceFromString.toJSON()).toEqual(EXPECTED_INDEX)
		})

		test('deserialization from object', () => {
			const instanceFromObject = GlobalIndex.fromJSON(EXPECTED_INDEX, NodeModule.currentEngineModule())
			expect(instanceFromObject.toJSON()).toEqual(EXPECTED_INDEX)

			// check wether it stays the same after inserting the same entries
			TEST_IDENTIFIERS.map((identifier: GlobalIdentifier) =>
				instanceFromObject.getSourceNodeIndex('upsert', identifier)
			)
			expect(instanceFromObject.toJSON()).toEqual(EXPECTED_INDEX)
		})

		const instance = GlobalIndex.fromJSON(JSON.stringify(EXPECTED_INDEX), NodeModule.currentEngineModule())
		runInstanceTests('deserialized instance related', instance)
	})
})
