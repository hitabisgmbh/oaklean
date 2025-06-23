import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('ts.SyntaxKind.VariableDeclaration', () => {
	const code = `
		const VariableDeclaration = class {
			constructor(args: any) {}
		}
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ReturnStatement', () => {
	const code = `
		const ReturnStatement = class {
			constructor(args: any) {
				return class {
					constructor(args: any) {}
				}
			}
		}
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
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

describe('ts.SyntaxKind.PropertyAccessExpression', () => {
	const code = `
		;({} as any).x = class {
			constructor(args: any) {}
		}
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.NewExpression', () => {
	const code = `
		new VariableDeclaration(class {
			constructor(args: any) {}
		})
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ParenthesizedExpression', () => {
	describe('NewExpression', () => {
		const code = `
		new (class {
			constructor(args: any) {}
		})(0)
	`

		it.todo('Should include the class name in the hierarchy')
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{constructor:constructor}': {
						type: ProgramStructureTreeType.ConstructorDeclaration,
					}
				}
			})
		})
	})

	describe('typeof', () => {
		const code = `
		typeof(class {
			constructor(args: any) {}
		})
	`

		it.todo('Should include the class name in the hierarchy')
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{constructor:constructor}': {
						type: ProgramStructureTreeType.ConstructorDeclaration,
					}	
				}
			})
		})
	})
})

describe('ts.SyntaxKind.CallExpression', () => {
	const code = `
		Object.entries(class {
			constructor(args: any) {}
		})
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.PropertyAssignment', () => {
	const code = `
		const PropertyAssignment = {
			PropertyAssignment: class {
				constructor(args: any) {}
			}
		};
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ArrayLiteralExpression', () => {
	const code = `
		const ArrayLiteralExpression = [class {
			constructor(args: any) {}
		}];
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ArrowFunction', () => {
	const code = `
		const fn = () => class {
			constructor(args: any) {}
		};
	`

	it.todo('Should include the class name in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:fn}': {
					type: ProgramStructureTreeType.ArrowFunctionExpression,
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

describe('ts.SyntaxKind.ConditionalExpression', () => {
	const code = `
		;undefined !== null ? class {
			constructor(args: any) {}
		} : class {
			constructor(args: any) {}
		};
	`

	it.todo('Should include the class name in the hierarchy')
	it.todo('Should identify two classes in the hierarchy')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{constructor:constructor}': {
					type: ProgramStructureTreeType.ConstructorDeclaration,
				}
			}
		})
	})
})