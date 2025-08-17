import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

const declarations = {
	'ts.SyntaxKind.ForStatement': 'let i = 0; i < 10; i++',
	'ts.SyntaxKind.ForOfStatement': 'const i of [1, 2, 3]',
	'ts.SyntaxKind.ForInStatement': 'const i in [1, 2, 3]'
}
for (const [kind, declaration] of Object.entries(declarations)) {
	describe(kind, () => {
		describe('empty', () => {
			const code = `
				const a = () => {}
				for (${declaration}) {}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(
					new UnifiedPath('test.ts'),
					code
				)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{functionExpression:a}': {
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				})
			})
		})

		describe('non empty', () => {
			const code = `
				const a = () => {}
				for (${declaration}) {
					const a = () => {}
				}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(
					new UnifiedPath('test.ts'),
					code
				)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{functionExpression:a}': {
							type: ProgramStructureTreeType.FunctionExpression
						},
						'{scope:(for:0)}': {
							type: ProgramStructureTreeType.ForStatement,
							children: {
								'{functionExpression:a}': {
									type: ProgramStructureTreeType.FunctionExpression
								}
							}
						}
					}
				})
			})
		})
	})
}

describe('all declarations', () => {
	describe('empty', () => {
		let code = 'const a = () => {}\n'
		for (const declaration of Object.values(declarations)) {
			code += `for (${declaration}) {}\n`
		}

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:a}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})

	describe('non empty', () => {
		let code = 'const a = () => {}\n'
		for (const declaration of Object.values(declarations)) {
			code += `for (${declaration}) {
					const a = () => {}
				}\n`
		}

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:a}': {
						type: ProgramStructureTreeType.FunctionExpression
					},
					'{scope:(for:0)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					},
					'{scope:(for:1)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					},
					'{scope:(for:2)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})
})
