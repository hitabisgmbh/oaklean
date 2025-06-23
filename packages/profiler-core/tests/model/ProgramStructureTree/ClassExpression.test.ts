import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'

describe('ts.SyntaxKind.ClassExpression', () => {
	const code = `
		const ClassExpression = class {
			constructor() {}
			static {
				function foo() {}
			}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{constructor:constructor}': {},
			'{function:foo}': {}
		})
	})
	it.todo('Should include the class name in the hierarchy')
})
