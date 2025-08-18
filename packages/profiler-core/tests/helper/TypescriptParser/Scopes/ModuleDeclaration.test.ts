import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('ts.SyntaxKind.ModuleDeclaration', () => {
	describe('empty', () => {
		const code = `
			module A {
			}
			module B {
			}
			module C {
				module D {
				}
			}
			module C.D {
			}
			namespace A1 {
			}
			namespace B1 {
			}
			namespace C1.D1 {
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root
			})
		})
	})

	describe('duplicate module declaration', () => {
		const code = `
			module A {
				function x() {
					return 1
				}
			}

			namespace A {
				function x() {
					return 1
				}
			}

			module A {
				export function x() {
					return 1
				}
			}

			module A.B {
				function x() {
					return 1
				}
			}

			namespace A.B {
				function x() {
					return 1
				}
			}

			module A.B {
				export function x() {
					return 1
				}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(namespace:A:1)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(namespace:A:2)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(namespace:A.B:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(namespace:A.B:1)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(namespace:A.B:2)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:x}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					}
				}
			})
		})
	})

	describe('mixed module and namespace declarations', () => {
		const code = `
			namespace A {
				export namespace B {
					export function f() {}
				}
			}

			module A.B {
				export function g() {}
			}
			`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{scope:(namespace:B:0)}': {
								type: ProgramStructureTreeType.ModuleDeclaration,
								children: {
									'{function:f}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(namespace:A.B:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{function:g}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					}
				}
			})
		})
	})

	describe('NamespaceDeclaration chain', () => {
		const code = `
			let x
			module A {
				export const a = () => { }
				x = () => {}
			}
			module B {
				export const a = () => { }
				x = () => {}
			}
			module A.B {
				export const a = () => { }
				x = () => {}
			}
			module A.B.C.D {
				export const a = () => { }
				x = () => {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					},
					'{scope:(namespace:B:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					},
					'{scope:(namespace:A.B:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					},
					'{scope:(namespace:A.B.C.D:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})

	describe('with nested module declarations', () => {
		const code = `
			let x
			module A {
				export const a = () => { }
				x = () => {}

				module B {
					export const a = () => { }
					x = () => {}
				}
			}
			const a = () => { }
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{scope:(namespace:B:0)}': {
								type: ProgramStructureTreeType.ModuleDeclaration,
								children: {
									'{functionExpression:a}': {
										type: ProgramStructureTreeType.FunctionExpression
									},
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					},
					'{functionExpression:a}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})

	describe('with nested exported module declarations', () => {
		const code = `
			let x
			module A {
				export const a = () => { }
				x = () => {}

				export module B {
					export const a = () => { }
					x = () => {}
				}
			}
			const a = () => { }
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{scope:(namespace:B:0)}': {
								type: ProgramStructureTreeType.ModuleDeclaration,
								children: {
									'{functionExpression:a}': {
										type: ProgramStructureTreeType.FunctionExpression
									},
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					},
					'{functionExpression:a}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})

	describe('with nested NamespaceDeclaration chain', () => {
		const code = `
			let x
			module A {
				export const a = () => { }
				x = () => {}

				module B.C {
					export const a = () => { }
					x = () => {}
				}
			}
			const a = () => { }
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:a}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.FunctionExpression
							},
							'{scope:(namespace:B.C:0)}': {
								type: ProgramStructureTreeType.ModuleDeclaration,
								children: {
									'{functionExpression:a}': {
										type: ProgramStructureTreeType.FunctionExpression
									},
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					},
					'{functionExpression:a}': {
						type: ProgramStructureTreeType.FunctionExpression
					}
				}
			})
		})
	})

	describe('with nested exported NamespaceDeclaration chain', () => {
		const code = `
			module A {
				export module B.C {
					export const a = () => { }
				}
			}

			module A.B.C {
				export const b = () => { }
			}
		`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(namespace:A:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{scope:(namespace:B.C:0)}': {
								type: ProgramStructureTreeType.ModuleDeclaration,
								children: {
									'{functionExpression:a}': {
										type: ProgramStructureTreeType.FunctionExpression
									}
								}
							}
						}
					},
					'{scope:(namespace:A.B.C:0)}': {
						type: ProgramStructureTreeType.ModuleDeclaration,
						children: {
							'{functionExpression:b}': {
								type: ProgramStructureTreeType.FunctionExpression
							}
						}
					}
				}
			})
		})
	})
})
