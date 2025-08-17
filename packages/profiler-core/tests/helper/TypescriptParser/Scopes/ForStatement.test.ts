import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

const examples = {
	'ts.SyntaxKind.ForStatement': 'for(let i = 0; i < 10; i++) { $innerCode }',
	'ts.SyntaxKind.ForStatement without block':
		'for(let i = 0; i < 10; i++) $innerCode',
	'ts.SyntaxKind.ForOfStatement': 'for(const i of [1, 2, 3]) { $innerCode }',
	'ts.SyntaxKind.ForOfStatement without block':
		'for(const i of [1, 2, 3]) $innerCode',
	'ts.SyntaxKind.ForInStatement': 'for(const i in [1, 2, 3]) { $innerCode }',
	'ts.SyntaxKind.ForInStatement without block':
		'for(const i in [1, 2, 3]) $innerCode'
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
						'{scope:(for:0)}': {
							type: ProgramStructureTreeType.ForStatement,
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

describe('ts.SyntaxKind.ForStatement in condition', () => {
	const code = `
		function a {}
		for(function a() {}; i < 10; i++) { }
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
				'{scope:(for:0)}': {
					type: ProgramStructureTreeType.ForStatement,
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

describe('ts.SyntaxKind.ForOfStatement in condition', () => {
	const code = `
		function a {}
		for(const i of function a() {}) { }
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
				'{scope:(for:0)}': {
					type: ProgramStructureTreeType.ForStatement,
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
					'{scope:(for:0)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(for:1)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(for:2)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(for:3)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(for:4)}': {
						type: ProgramStructureTreeType.ForStatement,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(for:5)}': {
						type: ProgramStructureTreeType.ForStatement,
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
