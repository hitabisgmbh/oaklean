import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('exports', () => {
	/*
		export = () => {}
		transpiled to:
		module.exports = () => {}

		This case:
		export = () => {}
		export = () => {}
		will throw, since the export can only be used once in a file

		BUT this case:
		module.exports = () => {}
		module.exports = () => {}
		will NOT throw, since it can be assigned multiple times

		so we should give them anonymous identifiers (like anonymous:0) instead of default,
		so both cases will have the same identifiers
	*/

	describe('module.exports', () => {
		const code = `
			module.exports = () => {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression,
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.ExportAssignment', () => {
		const code = `
			export = () => {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression,
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.DefaultKeyword', () => {
		const code = `
			export default () => {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression,
					}
				}
			})
		})
	})
})

describe('ts.SyntaxKind.ArrowFunction', () => {
	const code = `
		const ArrowFunction = () => () => {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:ArrowFunction}': {
					type: ProgramStructureTreeType.FunctionExpression,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.VariableDeclaration', () => {
	const code = `
		const VariableDeclaration = () => {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:VariableDeclaration}': {
					type: ProgramStructureTreeType.FunctionExpression,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ParenthesizedExpression', () => {
	const code = `
		;(() => {})()
		;(() => {})()
	`

	it.todo('Maybe we should not include the parenthesized expression in the hierarchy?')
	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				},
				'{functionExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.PropertyAssignment', () => {
	const code = `
		const obj = { method: () => {} }
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
						'{functionExpression:method}': {
							type: ProgramStructureTreeType.FunctionExpression,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.CallExpression', () => {
	const code = `
		Object.entries(() => {})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.BinaryExpression', () => {
	const code = `
		let x
		if(x = () => {}) {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{scope:(if:0)}': {
					type: ProgramStructureTreeType.IfStatement,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.Parameter', () => {
	const code = `
		function Parameter(f = () => {}) {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:Parameter}': {
					type: ProgramStructureTreeType.FunctionDeclaration,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression,
						}
					}
				}
			}
		})
	})
})

const forDeclarations = {
	'ts.SyntaxKind.ForStatement': 'let i = 0; i < 10; i = (() => { return i+1 })()',
	'ts.SyntaxKind.ForOfStatement': 'const ForInStatement of () => {}',
	'ts.SyntaxKind.ForInStatement': 'const ForInStatement in () => {}'
}

describe('ForStatement', () => {
	for (const [kind, declaration] of Object.entries(forDeclarations)) {
		describe(kind, () => {
			const code = `
				for(${declaration}) {}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{scope:(for:0)}': {
							type: ProgramStructureTreeType.ForStatement,
							children: {
								'{functionExpression:(anonymous:0)}': {
									type: ProgramStructureTreeType.FunctionExpression,
								}
							}
						}
					}
				})
			})
		})
	}
})


describe('ts.SyntaxKind.ArrayLiteralExpression', () => {
	const code = `
		;[() => {}, 42]
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ConditionalExpression', () => {
	const code = `
		true ? () => {} : () => {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				},
				'{functionExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ReturnStatement', () => {
	const code = `
		function ReturnStatement() {
			return () => {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:ReturnStatement}': {
					type: ProgramStructureTreeType.FunctionDeclaration,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression,
						
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.JsxExpression', () => {
	const code = `
		<div>{() => {}}</div>
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code, 'TSX')

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				
				}
			}
		})
	})
})

describe('ts.SyntaxKind.NewExpression', () => {
	const code = `
		new ArrowFunctionExpression(() => {})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ThrowStatement', () => {
	const code = `
		throw () => {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression,
				
				}
			}
		})
	})
})

describe('ArrowFunctionExpression in Class', () => {
	describe('ts.SyntaxKind.PrivateIdentifier', () => {
		const code = `
			class FunctionExpression {
				#private = () => {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:FunctionExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{functionExpression:#private}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.PropertyDeclaration', () => {
		const code = `
			class FunctionExpression {
				PropertyDeclaration = () => {};
				static PropertyDeclaration = () => {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:FunctionExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{functionExpression:PropertyDeclaration}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression@static:PropertyDeclaration}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.FirstLiteralToken', () => {
		const code = `
			class FunctionExpression {
				42 = () => {};
				static 42 = () => {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:FunctionExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{functionExpression:(literal:92cfceb3)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression@static:(literal:92cfceb3)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.StringLiteral', () => {
		const code = `
			class FunctionExpression {
				'StringLiteral' = () => {};
				static 'StringLiteral' = () => {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:FunctionExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{functionExpression:(literal:7e2b9fea)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression@static:(literal:7e2b9fea)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})

	describe(' ts.SyntaxKind.ComputedPropertyName', () => {
		const code = `
			const ComputedPropertyName = 'ComputedPropertyName'
			class FunctionExpression {
				[ComputedPropertyName] = () => {};
				static [ComputedPropertyName] = () => {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:FunctionExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{functionExpression:(expression:34832631)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression@static:(expression:34832631)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})
})