import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('exports', () => {
	/*
		export = function() {}
		transpiled to:
		module.exports = function() {}

		This case:
		export = function() {}
		export = function() {}
		will throw, since the export can only be used once in a file

		BUT this case:
		module.exports = function() {}
		module.exports = function() {}
		will NOT throw, since it can be assigned multiple times

		so we should give them anonymous identifiers (like anonymous:0) instead of default,
		so both cases will have the same identifiers
	*/
	describe('module.exports', () => {
		const code = `
			module.exports = function FunctionExpression() {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.ExportAssignment', () => {
		const code = `
			export = function FunctionExpression() {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{functionExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})
})

describe('ts.SyntaxKind.ArrowFunction', () => {
	const code = `
		const ArrowFunction = () => function () {}
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
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ExportAssignment', () => {
	const code = `
		export = function() {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.VariableDeclaration', () => {
	const code = `
		const VariableDeclaration = function() {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:VariableDeclaration}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ParenthesizedExpression', () => {
	const code = `
		;(function() {})()
		;(function() {})()
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				},
				'{functionExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.PropertyAssignment', () => {
	const code = `
		const obj = { method: function () {} }
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
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.CallExpression', () => {
	const code = `
		Object.entries(function () {})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.BinaryExpression', () => {
	const code = `
		let x
		if(x = function () {}) {}
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
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.Parameter', () => {
	const code = `
		function Parameter(f = function ParameterFunction() {}) {}
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
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

const forDeclarations = {
	'ts.SyntaxKind.ForStatement':
		'let i = 0; i < 10; i = (function ForStatement() { return i+1 })()',
	'ts.SyntaxKind.ForOfStatement':
		'const ForInStatement of function ForOfStatement() {}',
	'ts.SyntaxKind.ForInStatement':
		'const ForInStatement in function ForInStatement() {}'
}

describe('ForStatement', () => {
	for (const [kind, declaration] of Object.entries(forDeclarations)) {
		describe(kind, () => {
			const code = `
				for(${declaration}) {}
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
	}
})

const whileCodes = {
	'ts.SyntaxKind.WhileStatement': 'while (typeof (function WhileStatement() {}) === \'function\') {}',
	'ts.SyntaxKind.DoStatement': 'do {} while (typeof (function DoStatement() {}) === \'function\')'
}

describe('WhileStatement', () => {
	for (const [kind, code] of Object.entries(whileCodes)) {
		describe(kind, () => {
			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{scope:(while:0)}': {
							type: ProgramStructureTreeType.WhileStatement,
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
		;[function () {}, 42]
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ConditionalExpression', () => {
	const code = `
		true ? function () {} : function () {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				},
				'{functionExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ReturnStatement', () => {
	const code = `
		function ReturnStatement() {
			return function () {}
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
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.JsxExpression', () => {
	const code = `
		<div>{function() {} }</div>
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(
			new UnifiedPath('test.ts'),
			code,
			'TSX'
		)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.NewExpression', () => {
	const code = `
		new FunctionExpression(function() {})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ThrowStatement', () => {
	const code = `
		throw function() {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})

describe('FunctionExpression in Class', () => {
	describe('ts.SyntaxKind.PrivateIdentifier', () => {
		const code = `
			class FunctionExpression {
				#private = function() {}
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
				PropertyDeclaration = function() {};
				static PropertyDeclaration = function() {};
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
				42 = function() {};
				static 42 = function() {};
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
				'StringLiteral' = function() {};
				static 'StringLiteral' = function() {};
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

	describe('ts.SyntaxKind.ComputedPropertyName', () => {
		const code = `
			const ComputedPropertyName = 'ComputedPropertyName'

			class FunctionExpression {
				[ComputedPropertyName] = function() {};
				static [ComputedPropertyName] = function() {};
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

describe('ts.SyntaxKind.AsteriskToken', () => {
	const code = `
		const FunctionExpression = function* () {
			yield 1;
			yield 2;
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:FunctionExpression}': {
					type: ProgramStructureTreeType.FunctionExpression
				}
			}
		})
	})
})
