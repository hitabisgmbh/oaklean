import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('ts.SyntaxKind.ClassStaticBlockDeclaration', () => {
	describe('empty', () => {
		const code = `
			function a() {}
			const c = class {
				static {}
				static {}
			}
			class A {
				static {}
				static {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{classExpression:c}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{static:0}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration
							},
							'{static:1}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration
							}
						}
					},
					'{class:A}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{static:0}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration
							},
							'{static:1}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration
							}
						}
					}
				}
			})
		})
	})

	describe('non empty', () => {
		const code = `
			function a() {}
			const c = class {
				static {
					function a() { }
				}
				static {
					function a() { }
				}
			}
			class A {
				static {
					function a() { }
				}
				static {
					function a() { }
				}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{function:a}': {
						type: ProgramStructureTreeType.FunctionDeclaration
					},
					'{classExpression:c}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{static:0}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{static:1}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							}
						}
					},
					'{class:A}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{static:0}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration
									}
								}
							},
							'{static:1}': {
								type: ProgramStructureTreeType.ClassStaticBlockDeclaration,
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
