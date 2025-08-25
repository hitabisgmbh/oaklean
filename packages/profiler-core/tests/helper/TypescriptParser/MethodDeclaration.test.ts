import { ProgramStructureTree } from '../../../src'
import { DuplicateIdentifierHelper, TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../../src/types'

describe('ts.SyntaxKind.PrivateIdentifier', () => {
	const code = `
		class MethodDeclaration {
			#private () {}
			static #private () {}
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
						},
						'{method@static:#private}': {
							type: ProgramStructureTreeType.MethodDefinition
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

describe('ts.SyntaxKind.MethodDeclaration with signature', () => {
	test('empty signature', () => {
		const code = `
			class A {
				MethodDeclaration(): void
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
					type: ProgramStructureTreeType.ClassDeclaration
				}
			}
		})
	})

	test('signature with implementation', () => {
		const code = `
			class A {
				MethodDeclaration(): void
				MethodDeclaration(a?: number) {}
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:MethodDeclaration}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})

	test('multiple signatures with implementation', () => {
		const code = `
			class A {
				MethodDeclaration(): void
				MethodDeclaration(a: number): void
				MethodDeclaration(a?: number) {}
			}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:A}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{method:MethodDeclaration}': {
							type: ProgramStructureTreeType.MethodDefinition,
						}
					}
				}
			}
		})
	})
})

describe('handle duplicate identifier', () => {
	const root = new ProgramStructureTree(
		null,
		0,
		ProgramStructureTreeType.Root,
		IdentifierType.Name,
		'{root}' as SourceNodeIdentifierPart_string,
		{
			line: 1,
			column: 1
		},
		{
			line: 10,
			column: 1
		}
	)

	const child = new ProgramStructureTree(
		root,
		1,
		ProgramStructureTreeType.MethodDefinition,
		IdentifierType.Name,
		'{method:method}' as SourceNodeIdentifierPart_string,
		{
			line: 2,
			column: 1
		},
		{
			line: 3,
			column: 1
		}
	)
	root.children.set(child.identifier, child)
	
	test('n duplicates', () => {
		for (let i = 0; i < 10; i++) {
			const duplicateChild = new ProgramStructureTree(
				root,
				2,
				ProgramStructureTreeType.MethodDefinition,
				IdentifierType.Name,
				'{method:method}' as SourceNodeIdentifierPart_string,
				{
					line: 4,
					column: 1
				},
				{
					line: 5,
					column: 1
				}
			)
			DuplicateIdentifierHelper.handleDuplicateIdentifier(duplicateChild)
			expect(duplicateChild.identifier).toBe(`{method:method:${i+1}}` as SourceNodeIdentifierPart_string)

			root.children.set(duplicateChild.identifier, duplicateChild)
		}
	})

	describe('duplicates in code', () => {
		const code = `
			class MethodDeclaration {
				method() {
					const a = class {
						method() {
							const a = class {
								method() {}
							}
						}
					}
				}
				static method() {
					const a = class {
						method() {
							const a = class {
								method() {}
							}
						}
					}
				}

				method() {
					const a = class {
						method() {
							const a = class {
								method() {}
								method2() {}
							}
						}
						method() {
							const a = class {
								method() {}
								method2() {}
							}
						}
					}
				}
				static method() {
					const a = class {
						method() {
							const a = class {
								method() {}
								method2() {}
							}
						}
						method() {
							const a = class {
								method() {}
								method2() {}
							}
						}
					}
				}
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
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{method:method}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{method@static:method}': {
								type: ProgramStructureTreeType.MethodDefinition,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{method:method}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{method:method:1}': {
								type: ProgramStructureTreeType.MethodDefinition,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{method:method}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															},
															'{method:method2}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											},
											'{method:method:1}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															},
															'{method:method2}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{method@static:method:1}': {
								type: ProgramStructureTreeType.MethodDefinition,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{method:method}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															},
															'{method:method2}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											},
											'{method:method:1}': {
												type: ProgramStructureTreeType.MethodDefinition,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{method:method}': {
																type: ProgramStructureTreeType.MethodDefinition
															},
															'{method:method2}': {
																type: ProgramStructureTreeType.MethodDefinition
															}
														}
													}
												}
											}
										}
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