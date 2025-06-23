import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'


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

	it.todo('Should include the static in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:ClassDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration,
						},
						'{function:foo}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.DefaultKeyword', () => {
	const code = `
		export default class {
			constructor(args: any) {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:default}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration,
						}
					}
				}
			}
		})
	})
})
