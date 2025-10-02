import { NodeModule } from '../../../src/model/NodeModule'
import { GlobalIndex } from '../../../src/model/indices/GlobalIndex'
import { SourceNodeIndex } from '../../../src/model/indices/SourceNodeIndex'
import { GlobalIdentifier } from '../../../src/system/GlobalIdentifier'
import {
	LangInternalPath_string,
	GlobalSourceNodeIdentifier_string,
	ISourceNodeIndex,
	SourceNodeID_number,
	SourceNodeIndexType,
	SourceNodeIdentifierPart_string
} from '../../../src/types'


const EXPECTED_INDEX: ISourceNodeIndex<SourceNodeIndexType.SourceNode> = {
	children: undefined,
	id: 2 as SourceNodeID_number
}

function runInstanceTests(title: string, preDefinedInstance: () => SourceNodeIndex<SourceNodeIndexType.SourceNode>) {
	let instance: SourceNodeIndex<SourceNodeIndexType.SourceNode>

	beforeEach(() => {
		instance = preDefinedInstance()
	})

	it('should serialize correctly', () => {
		expect(instance.toJSON()).toEqual(EXPECTED_INDEX)
	})

	test('presentInOriginalSourceCode', () => {
		expect(instance.presentInOriginalSourceCode).toBe(true)
		instance.presentInOriginalSourceCode = false
		expect(instance.toJSON()).toEqual({
			id: 2,
			npiosc: true
		})
		instance.presentInOriginalSourceCode = true
	})

	test('isSourceNode', () => {
		expect(instance.isSourceNode()).toBe(true)
	})

	test('identifier', () => {
		expect(instance.identifier).toBe('{isAbsolute}')
	})

	test('functionName', () => {
		expect(instance.functionName).toBe('{isAbsolute}')
	})

	test('globalIdentifier', () => {
		expect(instance.globalIdentifier().identifier).toBe('node@20.11.1{node:path}{isAbsolute}')
	})
}
describe('SourceNodeIndex', () => {
	runInstanceTests('instance related', () => {
		const globalIndex = new GlobalIndex(new NodeModule('node', '20.11.1'))
		return globalIndex.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{node:path}{isAbsolute}' as GlobalSourceNodeIdentifier_string))
	})

	describe('deserialization', () => {
		runInstanceTests('deserialized instance related', () => {
			const globalIndex = new GlobalIndex(new NodeModule('node', '20.11.1'))
			const pathIndex = globalIndex.getLangInternalIndex('upsert').getFilePathIndex('upsert', 'node:path' as LangInternalPath_string)
			return SourceNodeIndex.fromJSON(
				EXPECTED_INDEX,
				['{isAbsolute}'] as SourceNodeIdentifierPart_string[],
				pathIndex,
				SourceNodeIndexType.SourceNode
			)
		})
	})
})