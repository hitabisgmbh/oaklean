import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('JestScope', () => {
	/**
	 * This is how jest wraps modules.
	 * This case is important because we need to detect this to correct the scope.
	 */
	describe('empty module', () => {
		const code = '({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest) {}})'

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root
			})
		})
	})

	describe('non empty module', () => {
		const code = `({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest) {
			function a() {}
			function b() {}
			var xyz = (() => {})();
		}})`

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