import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'

describe('ts.SyntaxKind.ClassDeclaration', () => {
	const code = `
		class ClassDeclaration {
			// ts.isConstructorDeclaration
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
			'{class:ClassDeclaration}': {
				'{constructor:constructor}': {},
				'{function:foo}': {}
			}
		})
	})
})
