import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('CommonJS', () => {
	/**
	 * This is how CommonJS wraps modules.
	 * This case is important because we need to detect this to correct the scope.
	 */
	describe('empty module', () => {
		const code = '(function (exports, require, module, __filename, __dirname) {})'

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root
			})
		})
	})
	
	describe('non empty module', () => {
		const code = `(function (exports, require, module, __filename, __dirname) {
			function a() {}
			function b() {}
			var xyz = (() => {})();
		})`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{function:b}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})
})