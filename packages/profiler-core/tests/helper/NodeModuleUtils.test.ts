import { NodeModuleUtils } from '../../src/helper/NodeModuleUtils'
import { UnifiedPath } from '../../src/system/UnifiedPath'

describe('NodeModuleUtils', () => {
	it('should have a static method getParentModuleFromPath()', () => {
		expect(NodeModuleUtils.getParentModuleFromPath).toBeTruthy()
	})

	describe('getParentModuleFromPath', () => {
		test('valid module path', () => {
			expect(
				NodeModuleUtils
					.getParentModuleFromPath(
						new UnifiedPath('path/to/node_modules/module/file/in/module'))?.toString()
			).toBe('./path/to/node_modules/module')
		})

		test('invalid module path', () => {
			expect(
				NodeModuleUtils
					.getParentModuleFromPath(
						new UnifiedPath('path/to/node_m0dules/module/file/in/module'))?.toString()
			).toBeUndefined()
		})

		test('scoped module path', () => {
			expect(
				NodeModuleUtils
					.getParentModuleFromPath(
						new UnifiedPath('path/to/node_modules/@hitabis/module/file/in/module'))?.toString()
			).toBe('./path/to/node_modules/@hitabis/module')
		})
	})
})