import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('ts.SyntaxKind.IfStatement', () => {
	describe('if', () => {
		const code = `
			let a
			if (Date.now() % 2 === 0)
				a = () => { }
			if (Date.now() % 2 === 0) {
				a = () => { }
			}
			if (Date.now() % 2 === 0) {}
			if (Date.now() % 2 === 0) {
				if (Date.now() % 2 === 0) {}
			}
			if (Date.now() % 2 === 0) {
				if (Date.now() % 2 === 0) {}
				if (Date.now() % 2 === 0) {
					a = () => { }
				}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(if:0)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression
									}
								}
							}
						}
					},
					'{scope:(if:1)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression
									}
								}
							}
						}
					},
					'{scope:(if:2)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{scope:(if:0)}': {
										type: ProgramStructureTreeType.Scope,
										children: {
											'{scope:then}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression
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

	describe('if-else-if', () => {
		const code = `
		let a
		if (Date.now() % 2 === 0) {
			a = () => { }
		} else if (Date.now() % 2 === 1) {
		} else {
			a = () => { }
		}`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(if:0)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression
									}
								}
							},
							'{scope:else}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{scope:(if:0)}': {
										type: ProgramStructureTreeType.Scope,
										children: {
											'{scope:else}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression
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

	describe('else if', () => {
		const code = `
			let a
			if (Date.now() % 2 === 0)
				a = () => { }
			else if (Date.now() % 2 === 1)
				a = () => { }
			else {
				a = () => { }
			}

			if (Date.now() % 2 === 0) {
				if (Date.now() % 2 === 0) {}
			} else if (Date.now() % 2 === 1) {
			} else {
				if (Date.now() % 2 === 0) {
					if (Date.now() % 2 === 0) {}
				}
			}

			if (Date.now() % 2 === 0) {
				a = () => { }
			}
			else if (Date.now() % 2 === 1)
				a = () => { }
			else {
				a = () => { }
			}

			`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(if:0)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression,
									}
								}
							},
							'{scope:else}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{scope:(if:0)}': {
										type: ProgramStructureTreeType.Scope,
										children: {
											'{scope:then}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression,
													}
												}
											},
											'{scope:else}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression,
													}
												}
											}
										}
									}
								}
							}
						}
					},
					'{scope:(if:1)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression,
									}
								}
							},
							'{scope:else}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{scope:(if:0)}': {
										type: ProgramStructureTreeType.Scope,
										children: {
											'{scope:then}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression,
													}
												}
											},
											'{scope:else}': {
												type: ProgramStructureTreeType.Scope,
												children: {
													'{functionExpression:(anonymous:0)}': {
														type: ProgramStructureTreeType.ArrowFunctionExpression,
													}
												}
											}
										}
									}
								}
							}
						}
					},
				}
			})
		})
	})

	describe('if binary expression', () => {
		const code = `
			let a
			if(a = () => { }) {
				a = () => { }
			}
		`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{scope:(if:0)}': {
						type: ProgramStructureTreeType.Scope,
						children: {
							'{functionExpression:(anonymous:0)}': {
								type: ProgramStructureTreeType.ArrowFunctionExpression
							},
							'{scope:then}': {
								type: ProgramStructureTreeType.Scope,
								children: {
									'{functionExpression:(anonymous:0)}': {
										type: ProgramStructureTreeType.ArrowFunctionExpression
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
