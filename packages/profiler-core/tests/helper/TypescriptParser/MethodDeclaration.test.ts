import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('ts.SyntaxKind.PrivateIdentifier', () => {
	const code = `
		class MethodDeclaration {
			#private () {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:MethodDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:#private}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.Identifier', () => {
	const code = `
		class MethodDeclaration {
			method() {}
			static method() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:MethodDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:method}': {
							type: ProgramStructureTreeType.MethodDefinition,
						},
						'{method@static:method}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FirstLiteralToken', () => {
	const code = `
		class MethodDeclaration {
			42() {}
			static 42() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:MethodDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						},
						'{method@static:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FunctionExpression', () => {
	const code = `
		class MethodDeclaration {
			'StringLiteral'() {}
			static 'StringLiteral'() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:MethodDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						},
						'{method@static:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ComputedPropertyName', () => {
	const code = `
		const ComputedPropertyName = 'ComputedPropertyName'
		class MethodDeclaration {
			[ComputedPropertyName](){};
			static [ComputedPropertyName](){};
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:MethodDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:(expression:34832631)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						},
						'{method@static:(expression:34832631)}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ObjectLiteralExpression', () => {
	const code = `
		const obj = { method() {} }
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{scope:(obj:obj)}': {
					type: ProgramStructureTreeType.ObjectLiteralExpression,
					children: {
						'{method:method}': {
							type: ProgramStructureTreeType.MethodDefinition
						}
					}
				}
			}
		})
	})
})