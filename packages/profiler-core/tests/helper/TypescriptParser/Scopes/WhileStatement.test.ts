import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

const examples = {
	'ts.SyntaxKind.WhileStatement': 'while (true) { $innerCode }',
	'ts.SyntaxKind.WhileStatement without block': 'while (true) $innerCode',
	'ts.SyntaxKind.DoStatement': 'do { $innerCode } while (true)',
	'ts.SyntaxKind.DoStatement without block': 'do $innerCode; while (true)'
}
for (const [kind, example] of Object.entries(examples)) {
	describe(kind, () => {
		describe('empty', () => {
			const code = `
				function a {}
				${example.replace('$innerCode', '')}
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
						'{function:a}': {
							type: ProgramStructureTreeType.FunctionDeclaration
						}
					}
				})
			})
		})

		describe('non empty', () => {
			const code = `
				function a {}
				${example.replace('$innerCode', 'function a {}')}
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
						'{function:a}': {
							type: ProgramStructureTreeType.FunctionDeclaration
						},
						'{scope:(while:0)}': {
							type: ProgramStructureTreeType.WhileStatement,
							children: {
								'{function:a}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								}
							}
						}
					}
				})
			})
		})
	})
}


describe('ts.SyntaxKind.WhileStatement in condition', () => {
	const code = `
		function a {}
		while (typeof function a {} === 'function') { }
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:a}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				},
				'{scope:(while:0)}': {
					type: ProgramStructureTreeType.WhileStatement,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.DoStatement in condition', () => {
	const code = `
		function a {}
		do {} while (typeof function a {} === 'function')
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:a}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				},
				'{scope:(while:0)}': {
					type: ProgramStructureTreeType.WhileStatement,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('all examples', () => {
	describe('empty', () => {
		let code = 'function a {}\n'
		for (const example of Object.values(examples)) {
			code += `${example.replace('$innerCode', '')}\n`
		}

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					}
				}
			})
		})
	})

	describe('non empty', () => {
		let code = 'function a {}\n'
		for (const example of Object.values(examples)) {
			code += `${example.replace('$innerCode', 'function a {}')}\n`
		}

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{scope:(while:0)}': {
						type: ProgramStructureTreeType.WhileStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(while:1)}': {
						type: ProgramStructureTreeType.WhileStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(while:2)}': {
						type: ProgramStructureTreeType.WhileStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(while:3)}': {
						type: ProgramStructureTreeType.WhileStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					}
				}
			})
		})
	})
})
