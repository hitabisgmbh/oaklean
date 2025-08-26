import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('ts.SyntaxKind.PrivateIdentifier', () => {
	const code = `
		class GetAccessorDeclaration {
			get #private () {}
			static get #private () {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:#private}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:#private}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.Identifier', () => {
	const code = `
		class GetAccessorDeclaration {
			get a() {}
			static get a() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:a}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:a}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FirstLiteralToken', () => {
	const code = `
		class GetAccessorDeclaration {
			get 42() {}
			static get 42() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.BigIntLiteral', () => {
	const code = `
		class GetAccessorDeclaration {
			get 42n() {}
			static get 42n() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:(literal:40a3fd3b)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:(literal:40a3fd3b)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FunctionExpression', () => {
	const code = `
		class GetAccessorDeclaration {
			get 'StringLiteral'() {}
			static get 'StringLiteral'() {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
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
		class GetAccessorDeclaration {
			get [ComputedPropertyName](){};
			static get [ComputedPropertyName](){};
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:(expression:34832631)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						},
						'{get@static:(expression:34832631)}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ObjectLiteralExpression', () => {
	const code = `
		const obj = { get a() {} }
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
						'{get:a}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('duplicates in code', () => {
	const code = `
		class GetAccessorDeclaration {
			get getter() {
				const a = class {
					get getter() {
						const a = class {
							get getter() {}
						}
					}
				}
			}
			static get getter() {
				const a = class {
					get getter() {
						const a = class {
							get getter() {}
						}
					}
				}
			}

			get getter() {
				const a = class {
					get getter() {
						const a = class {
							get getter() {}
							get getter2() {}
						}
					}
					get getter() {
						const a = class {
							get getter() {}
							get getter2() {}
						}
					}
				}
			}
			static get getter() {
				const a = class {
					get getter() {
						const a = class {
							get getter() {}
							get getter2() {}
						}
					}
					get getter() {
						const a = class {
							get getter() {}
							get getter2() {}
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
				'{class:GetAccessorDeclaration}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{get:getter}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
							children: {
								'{classExpression:a}': {
									type: ProgramStructureTreeType.ClassExpression,
									children: {
										'{get:getter}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														}
													}
												}
											}
										}
									}
								}
							}
						},
						'{get@static:getter}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
							children: {
								'{classExpression:a}': {
									type: ProgramStructureTreeType.ClassExpression,
									children: {
										'{get:getter}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														}
													}
												}
											}
										}
									}
								}
							}
						},
						'{get:getter:1}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
							children: {
								'{classExpression:a}': {
									type: ProgramStructureTreeType.ClassExpression,
									children: {
										'{get:getter}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														},
														'{get:getter2}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														}
													}
												}
											}
										},
										'{get:getter:1}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														},
														'{get:getter2}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														}
													}
												}
											}
										}
									}
								}
							}
						},
						'{get@static:getter:1}': {
							type: ProgramStructureTreeType.GetAccessorDeclaration,
							children: {
								'{classExpression:a}': {
									type: ProgramStructureTreeType.ClassExpression,
									children: {
										'{get:getter}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														},
														'{get:getter2}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														}
													}
												}
											}
										},
										'{get:getter:1}': {
											type: ProgramStructureTreeType.GetAccessorDeclaration,
											children: {
												'{classExpression:a}': {
													type: ProgramStructureTreeType.ClassExpression,
													children: {
														'{get:getter}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
														},
														'{get:getter2}': {
															type: ProgramStructureTreeType.GetAccessorDeclaration
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