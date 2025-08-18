import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'


describe('ts.SyntaxKind.SwitchStatement', () => {
	describe('empty', () => {
		const code = `
			switch (Date.now() % 2) {
				case 0:
					break
				default:
					break
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

	describe('only cases', () => {
		const code = `
			switch (Date.now() % 2) {
				case 0:
					break
				default:
					break
			}
			switch (Date.now() % 5) {
				case 0:
					break
				case 1:
					function a() {}
					break
				case 2:
					break
				case 3:
					function a() {}
					break
				case 4:
					break
			}
			switch (Date.now() % 5) {
				case 0:
					break
				case 1:
					function a() {}
					break
				case 2:
					break
				case 3:
					function a() {}
					break
				case 4:
					break
			}
			function a() {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(switch:0)}': {
						type: ProgramStructureTreeType.SwitchStatement,
						children: {
							'{scope:(case:356a192b)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:77de68da)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(switch:1)}': {
						type: ProgramStructureTreeType.SwitchStatement,
						children: {
							'{scope:(case:356a192b)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:77de68da)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					}
				}
			})
		})
	})

	describe('with default cases', () => {
		const code = `
			switch (Date.now() % 5) {
				default:
					function a() {}
				case 0:
					break
				case 1:
					function a() {}
					break
				case 2:
					break
				case 3:
					function a() {}
					break
				case 4:
					break
			}
			switch (Date.now() % 5) {
				case 0:
					break
				case 1:
					function a() {}
					break
				case 2:
					break
				case 3:
					function a() {}
					break
				case 4:
					break
				default:
					function a() {}
			}
			function a() {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(switch:0)}': {
						type: ProgramStructureTreeType.SwitchStatement,
						children: {
							'{scope:(case:356a192b)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:77de68da)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:default)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(switch:1)}': {
						type: ProgramStructureTreeType.SwitchStatement,
						children: {
							'{scope:(case:356a192b)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:77de68da)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:default)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					}
				}
			})
		})
	})

	describe('with nested switch statements', () => {
		const code = `
			switch (Date.now() % 5) {
				case 0:
					switch (Date.now() % 2) {
						case 0:
							function a() {}
							break
						default:
							function a() {}
					}
					break
				case 1:
					function a() {}
					switch (Date.now() % 2) {
						case 0:
							break
						default:
					}
					break
				case 2:
					switch (Date.now() % 2) {
						case 0:
							break
						default:
					}
					break
				case 3:
					function a() {}
					break
				case 4:
					break
			}
			function a() {}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(switch:0)}': {
						type: ProgramStructureTreeType.SwitchStatement,
						children: {
							'{scope:(case:b6589fc6)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{scope:(switch:0)}': {
										type: ProgramStructureTreeType.SwitchStatement,
										children: {
											'{scope:(case:b6589fc6)}': {
												type: ProgramStructureTreeType.SwitchCaseClause,
												children: {
													'{function:a}': {
														type: ProgramStructureTreeType.FunctionDeclaration
													}
												}
											},
											'{scope:(case:default)}': {
												type: ProgramStructureTreeType.SwitchCaseClause,
												children: {
													'{function:a}': {
														type: ProgramStructureTreeType.FunctionDeclaration
													}
												}
											}
										}
									}
								}
							},
							'{scope:(case:356a192b)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(case:77de68da)}': {
								type: ProgramStructureTreeType.SwitchCaseClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					}
				}
			})
		})
	})
})