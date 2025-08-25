import { ProgramStructureTree } from '../../../src/model/ProgramStructureTree'
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
		class SetAccessorDeclaration {
			set #private () {}
			static set #private () {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:SetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{set:#private}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						},
						'{set@static:#private}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.Identifier', () => {
	const code = `
		class SetAccessorDeclaration {
			set a() {}
			static set a() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:SetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{set:a}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						},
						'{set@static:a}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FirstLiteralToken', () => {
	const code = `
		class SetAccessorDeclaration {
			set 42() {}
			static set 42() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:SetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{set:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						},
						'{set@static:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FunctionExpression', () => {
	const code = `
		class SetAccessorDeclaration {
			set 'StringLiteral'() {}
			static set 'StringLiteral'() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:SetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{set:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						},
						'{set@static:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
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
		class SetAccessorDeclaration {
			set [ComputedPropertyName](){};
			static set [ComputedPropertyName](){};
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:SetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{set:(expression:34832631)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						},
						'{set@static:(expression:34832631)}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ObjectLiteralExpression', () => {
	const code = `
		const obj = { set a() {} }
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
						'{set:a}': {
							type: ProgramStructureTreeType.SetAccessorDeclaration
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
		ProgramStructureTreeType.SetAccessorDeclaration,
		IdentifierType.Name,
		'{set:setter}' as SourceNodeIdentifierPart_string,
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
				ProgramStructureTreeType.SetAccessorDeclaration,
				IdentifierType.Name,
				'{set:setter}' as SourceNodeIdentifierPart_string,
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
			expect(duplicateChild.identifier).toBe(`{set:setter:${i+1}}` as SourceNodeIdentifierPart_string)

			root.children.set(duplicateChild.identifier, duplicateChild)
		}
	})

	describe('duplicates in code', () => {
		const code = `
			class SetAccessorDeclaration {
				set setter(x) {
					const a = class {
						set setter(x) {
							const a = class {
								set setter(x) {}
							}
						}
					}
				}
				static set setter(x) {
					const a = class {
						set setter(x) {
							const a = class {
								set setter(x) {}
							}
						}
					}
				}

				set setter(x) {
					const a = class {
						set setter(x) {
							const a = class {
								set setter(x) {}
								set setter2(x) {}
							}
						}
						set setter(x) {
							const a = class {
								set setter(x) {}
								set setter2(x) {}
							}
						}
					}
				}
				static set setter(x) {
					const a = class {
						set setter(x) {
							const a = class {
								set setter(x) {}
								set setter2(x) {}
							}
						}
						set setter(x) {
							const a = class {
								set setter(x) {}
								set setter2(x) {}
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
					'{class:SetAccessorDeclaration}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{set:setter}': {
								type: ProgramStructureTreeType.SetAccessorDeclaration,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{set:setter}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{set@static:setter}': {
								type: ProgramStructureTreeType.SetAccessorDeclaration,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{set:setter}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{set:setter:1}': {
								type: ProgramStructureTreeType.SetAccessorDeclaration,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{set:setter}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															},
															'{set:setter2}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															}
														}
													}
												}
											},
											'{set:setter:1}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															},
															'{set:setter2}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															}
														}
													}
												}
											}
										}
									}
								}
							},
							'{set@static:setter:1}': {
								type: ProgramStructureTreeType.SetAccessorDeclaration,
								children: {
									'{classExpression:a}': {
										type: ProgramStructureTreeType.ClassExpression,
										children: {
											'{set:setter}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															},
															'{set:setter2}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															}
														}
													}
												}
											},
											'{set:setter:1}': {
												type: ProgramStructureTreeType.SetAccessorDeclaration,
												children: {
													'{classExpression:a}': {
														type: ProgramStructureTreeType.ClassExpression,
														children: {
															'{set:setter}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
															},
															'{set:setter2}': {
																type: ProgramStructureTreeType.SetAccessorDeclaration
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