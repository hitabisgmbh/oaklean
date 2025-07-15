import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('JestScope', () => {
	/**
	 * This is how jest wraps modules.
	 * This case is important because we need to detect this to correct the scope.
	 */
	const code = `
	({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest) {}})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{scope:(anonymous:0)}': {
					type: ProgramStructureTreeType.ObjectLiteralExpression,
					children: {
						'{functionExpression:(literal:1f50cf08)}': {
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})