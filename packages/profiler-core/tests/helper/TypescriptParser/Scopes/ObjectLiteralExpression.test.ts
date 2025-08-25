import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'


describe('with no executable children', () => {
	const code = `
		const obj = {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root
		})
	})
})

describe('with executable children', () => {
	const code = `
		const obj = {
			method() {},
			a: {
				method() {}
			}
		};
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
						},
						'{scope:(obj:a)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('with deep nested executable children', () => {
	const code = `
		const obj = {
			a: {
				method() {},
				c: {}
			},
			b: {
				method() {},
				c: {}
			}
		}
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
						'{scope:(obj:a)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						},
						'{scope:(obj:b)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('ObjectLiteralExpression in Class', () => {
	describe('ts.SyntaxKind.PrivateIdentifier', () => {
		const code = `
			class ObjectLiteralExpression {
				#private = {
					prop: function() {}
				}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ObjectLiteralExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{scope:(obj:#private)}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.PropertyDeclaration', () => {
		const code = `
			class ObjectLiteralExpression {
				PropertyDeclaration = {
					prop: function() {}
				};
				static PropertyDeclaration = {
					prop: function() {}
				};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ObjectLiteralExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{scope:(obj:PropertyDeclaration)}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							},
							'{scope:(obj@static:PropertyDeclaration)}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.FirstLiteralToken', () => {
		const code = `
			class ObjectLiteralExpression {
				42 = {
					prop: function() {}
				};
				static 42 = {
					prop: function() {}
				};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ObjectLiteralExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{scope:(obj:(literal:92cfceb3))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							},
							'{scope:(obj@static:(literal:92cfceb3))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.StringLiteral', () => {
		const code = `
			class ObjectLiteralExpression {
				'StringLiteral' = {
					prop: function() {}
				};
				static 'StringLiteral' = {
					prop: function() {}
				};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ObjectLiteralExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{scope:(obj:(literal:7e2b9fea))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							},
							'{scope:(obj@static:(literal:7e2b9fea))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
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
			class ObjectLiteralExpression {
				[ComputedPropertyName] = {
					prop: function() {}
				};
				static [ComputedPropertyName] = {
					prop: function() {}
				};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ObjectLiteralExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{scope:(obj:(expression:34832631))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							},
							'{scope:(obj@static:(expression:34832631))}': {
								type: ProgramStructureTreeType.ObjectLiteralExpression,
								children: {
									'{functionExpression:prop}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					}
				}
			})
		})
	})
})