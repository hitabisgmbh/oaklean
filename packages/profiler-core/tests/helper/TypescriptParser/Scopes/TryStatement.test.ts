import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('ts.SyntaxKind.TryStatement', () => {
	describe('empty', () => {
		const code = `
			function a() {}
			try {}
			try {} catch {}
			try {} catch (e) {}
			try {} catch {} finally {}
			try {} catch (e) {} finally {}
		`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					}
				}
			})
		})
	})

	describe('non empty', () => {
		const code = `
			function a() {}
			try { function a() {} }
			try { function a() {} } catch { function a() {} }
			try { function a() {} } catch (e) { function a() {} }
			try { function a() {} } catch { function a() {} } finally { function a() {} }
			try { function a() {} } catch (e) { function a() {} } finally { function a() {} }
		`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: 'Root',
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{scope:(try:0)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:1)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:2)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:3)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(finally)}': {
								type: ProgramStructureTreeType.FinallyBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:4)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(finally)}': {
								type: ProgramStructureTreeType.FinallyBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					}
				}
			})
		})
	})

	describe('partially empty', () => {
		const code = `
			function a() {}
			try { function a() {} }
			catch { }

			try { }
			catch { function a() {} }

			try { function a() {} }
			catch { }
			finally { }

			try { }
			catch { function a() {} }
			finally { }

			try { function a() {} }
			catch { function a() {} }
			finally { }

			try { }
			catch { }
			finally { function a() {} }

			try { function a() {} }
			catch { }
			finally { function a() {} }

			try { }
			catch { function a() {} }
			finally { function a() {} }

		`
		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			console.log(JSON.stringify(hierarchy, null, 2))

			expect(hierarchy).toEqual({
				type: 'Root',
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{scope:(try:0)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:1)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:2)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:3)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:4)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:5)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(finally)}': {
								type: ProgramStructureTreeType.FinallyBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:6)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(try)}': {
								type: ProgramStructureTreeType.TryBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(finally)}': {
								type: ProgramStructureTreeType.FinallyBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{scope:(try:7)}': {
						type: ProgramStructureTreeType.TryStatement,
						children: {
							'{scope:(catch)}': {
								type: ProgramStructureTreeType.CatchClause,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{scope:(finally)}': {
								type: ProgramStructureTreeType.FinallyBlock,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
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
