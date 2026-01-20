import { UnifiedPath } from '../../src/system/UnifiedPath'
import { NodeModule } from '../../src/model/NodeModule'
import { INodeModule, NodeModuleIdentifier_string } from '../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)

const EXAMPLE_NODE_MODULE: INodeModule = {
	name: 'package-name',
	version: '1.0.1'
}

const EXAMPLE_NODE_MODULE_BUFFER = '0c007061636b6167652d6e616d650500312e302e31'

function runInstanceTests(title: string, preDefinedInstance: () => NodeModule) {
	describe(title, () => {
		let instance: NodeModule

		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof NodeModule', () => {
			expect(instance instanceof NodeModule).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a method identifier()', () => {
			expect(instance.identifier).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(NodeModule.fromJSON).toBeTruthy()
		})

		it('should have a static method fromNodeModulePath()', () => {
			expect(NodeModule.fromNodeModulePath).toBeTruthy()
		})

		test('identifier', () => {
			expect(instance.identifier).toBe('package-name@1.0.1')
		})

		test('serialization', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_NODE_MODULE)
		})

		test('toBuffer', () => {
			expect(instance.toBuffer().toString('hex')).toBe(EXAMPLE_NODE_MODULE_BUFFER)
		})
	})
}

describe('NodeModule', () => {
	runInstanceTests('instance related', () => {
		return new NodeModule('package-name', '1.0.1')
	})

	describe('fromIdentifier', () => {
		test('invalid format', () => {
			const a = () => {
				NodeModule.fromIdentifier('' as NodeModuleIdentifier_string)
			}

			expect(a).toThrow('NodeModule.fromIdentifier: invalid format: ')

			const b = () => {
				NodeModule.fromIdentifier('package' as NodeModuleIdentifier_string)
			}

			expect(b).toThrow('NodeModule.fromIdentifier: invalid format: package')

			const c = () => {
				NodeModule.fromIdentifier('@scope/package' as NodeModuleIdentifier_string)
			}

			expect(c).toThrow('NodeModule.fromIdentifier: invalid format: @scope/package')

			const d = () => {
				NodeModule.fromIdentifier('@1.0.1' as NodeModuleIdentifier_string)
			}

			expect(d).toThrow('NodeModule.fromIdentifier: invalid format: @1.0.1')
		})

		test('package with version', () => {
			expect(NodeModule.fromIdentifier('package@1.0.1' as NodeModuleIdentifier_string).toJSON()).toEqual({
				name: 'package',
				version: '1.0.1'
			})
		})

		test('scoped package with version', () => {
			expect(NodeModule.fromIdentifier('@scope/package@1.0.1' as NodeModuleIdentifier_string).toJSON()).toEqual({
				name: '@scope/package',
				version: '1.0.1'
			})
		})
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {
			const instanceFromString = NodeModule.fromJSON(JSON.stringify(EXAMPLE_NODE_MODULE))
			expect(instanceFromString.toJSON()).toEqual(EXAMPLE_NODE_MODULE)
		})

		test('deserialization from object', () => {
			const instanceFromObject = NodeModule.fromJSON(EXAMPLE_NODE_MODULE)
			expect(instanceFromObject.toJSON()).toEqual(EXAMPLE_NODE_MODULE)
		})

		runInstanceTests('deserialization instance related', () => {
			return NodeModule.fromJSON(JSON.stringify(EXAMPLE_NODE_MODULE))
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_NODE_MODULE_BUFFER, 'hex')

		test('consume from buffer', () => {
			const { instance, remainingBuffer } = NodeModule.consumeFromBuffer(buffer)
			expect(instance.toJSON()).toEqual(EXAMPLE_NODE_MODULE)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const { instance } = NodeModule.consumeFromBuffer(buffer)
			return instance
		})
	})

	describe('fromNodeModulePath', () => {
		test('load existing node module', () => {
			const nodeModulePath = CURRENT_DIR.join('..', '..', 'node_modules', 'find-up')
			const existingNodeModule = NodeModule.fromNodeModulePath(nodeModulePath)

			expect(existingNodeModule?.name).toBe('find-up')
			expect(existingNodeModule?.version).toBe('8.0.0')
		})

		test('load non existing node module', () => {
			const nodeModulePath = CURRENT_DIR.join('')
			const nonExistingNodeModule = NodeModule.fromNodeModulePath(nodeModulePath)
			expect(nonExistingNodeModule).toBeUndefined()
		})
	})
})
