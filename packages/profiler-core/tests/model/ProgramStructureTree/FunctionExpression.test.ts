import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'

describe('ts.SyntaxKind.ArrowFunction', () => {
	const code = `
		const ArrowFunction = () => {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{functionExpression:ArrowFunction}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:VariableDeclaration}': {}
		})
	})
})

describe('ts.SyntaxKind.ParenthesizedExpression', () => {
	const code = `
		;(function() {})()
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{functionExpression:(expression:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
			'{function:Parameter}': {
				'{functionExpression:(anonymous:0)}': {}
			}
		})
	})
})

describe('ts.SyntaxKind.ForInStatement', () => {
	const code = `
		for(const ForInStatement in function ForInStatement() {}) {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{functionExpression:(anonymous:0)}': {}
		})
	})
})

describe('ts.SyntaxKind.ArrayLiteralExpression', () => {
	const code = `
		;[function () {}, 42]
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {},
			'{functionExpression:(anonymous:1)}': {}
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
			'{function:ReturnStatement}': {
				'{functionExpression:(anonymous:0)}': {}
			}
		})
	})
})

describe('ts.SyntaxKind.JsxExpression', () => {
	const code = `
		<div>{function() {} }</div>
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code, 'TSX')

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
			'{functionExpression:(anonymous:0)}': {}
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
				'{class:FunctionExpression}': {
					'{functionExpression:#private}': {}
				}
			})
		})
	})

	describe('ts.SyntaxKind.PropertyDeclaration', () => {
		const code = `
			class FunctionExpression {
				PropertyDeclaration = function() {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				'{class:FunctionExpression}': {
					'{functionExpression:PropertyDeclaration}': {}
				}
			})
		})
	})

	describe('ts.SyntaxKind.FirstLiteralToken', () => {
		const code = `
			class FunctionExpression {
				42 = function() {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				'{class:FunctionExpression}': {
					'{functionExpression:(literal:0)}': {}
				}
			})
		})
	})

	describe('ts.SyntaxKind.StringLiteral', () => {
		const code = `
			class FunctionExpression {
				'StringLiteral' = function() {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				'{class:FunctionExpression}': {
					'{functionExpression:(literal:0)}': {}
				}
			})
		})
	})

	describe('ts.SyntaxKind.ComputedPropertyName', () => {
		const code = `
			const ComputedPropertyName = 'Computed' + 'Property' + 'Name'

			class FunctionExpression {
				[ComputedPropertyName] = function() {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				'{class:FunctionExpression}': {
					'{functionExpression:(expression:0)}': {}
				}
			})
		})
	})
})
