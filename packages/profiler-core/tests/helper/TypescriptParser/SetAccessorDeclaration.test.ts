import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

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