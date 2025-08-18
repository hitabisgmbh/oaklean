import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('exports', () => {
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
})

describe('ts.SyntaxKind.ClassDeclaration', () => {
	const code = `
		class ClassDeclaration {
			// ts.isConstructorDeclaration
			constructor() {}

			static {
				function foo() {}
			}
			foo() {}
			static foo() {}
		}
	`

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
						'{static:0}': {
							type: ProgramStructureTreeType.ClassStaticBlockDeclaration,
							children: {
								'{function:foo}': {
									type: ProgramStructureTreeType.FunctionDeclaration,
								}
							}
						},
						'{method:foo}': {
							type: ProgramStructureTreeType.MethodDefinition
						},
						'{method@static:foo}': {
							type: ProgramStructureTreeType.MethodDefinition
						},
					}
				}
			}
		})
	})
})
