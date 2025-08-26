import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('ts.SyntaxKind.Constructor', () => {
	const code = `
		class A {
			constructor(args: any) {}
		}
	`
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
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

describe('ts.SyntaxKind.Constructor with signatures', () => {
	test('empty signature', () => {
		const code = `
			class A {
				constructor();
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
					type: ProgramStructureTreeType.ClassDeclaration
				}
			}
		})
	})

	test('signature with implementation', () => {
		const code = `
			class A {
				constructor();
				constructor() {}
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
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

	test('multiple signatures with implementation', () => {
		const code = `
			class A {
				constructor();
				constructor(a: number);
				constructor(a?: number) {}
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
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

describe('static ', () => {
	const code = `
		class A {
			constructor(args: any) {}
			static constructor(args: any) {}
		}
	`
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration,
						},
						'{method@static:constructor}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})