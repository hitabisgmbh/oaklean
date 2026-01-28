import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('exports', () => {
	describe('ts.SyntaxKind.DefaultKeyword', () => {
		describe('without function name', () => {
			const code = `
				export default function () {}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(
					new UnifiedPath('test.ts'),
					code
				)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{function:default}': {
							type: ProgramStructureTreeType.FunctionDeclaration
						}
					}
				})
			})
		})

		describe('with function name', () => {
			const code = `
				export default function DefaultKeyword() {}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(
					new UnifiedPath('test.ts'),
					code
				)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{function:DefaultKeyword}': {
							type: ProgramStructureTreeType.FunctionDeclaration
						}
					}
				})
			})
		})
	})
})

describe('ts.SyntaxKind.FunctionDeclaration', () => {
	const code = `
		function FunctionDeclaration() {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:FunctionDeclaration}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				}
			}
		})
	})
})

describe('ts.SyntaxKind.AsteriskToken', () => {
	const code = `
		function* FunctionDeclaration() {
			yield 1;
			yield 2;
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:FunctionDeclaration}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				}
			}
		})
	})
})

describe('ts.SyntaxKind.FunctionDeclaration with signature', () => {
	test('empty signature', () => {
		const code = `
			function FunctionDeclarationSignature(): void;
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root
		})
	})

	test('signature with implementation', () => {
		const code = `
			function FunctionDeclarationSignature(): void;
			function FunctionDeclarationSignature() {}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:FunctionDeclarationSignature}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				}
			}
		})
	})

	test('multiple signatures with implementation', () => {
		const code = `
			function FunctionDeclarationSignature(): void;
			function FunctionDeclarationSignature(a: number): void;
			function FunctionDeclarationSignature(a?: number) {}
		`

		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:FunctionDeclarationSignature}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				}
			}
		})
	})
})

describe('duplicates in code', () => {
	const code = `
		function f() {
			function f() {
				function f() {}
			}
			function f() {
				function f() {}
			}
		}

		function f() {
			function f() {
				function f() {}
				function a() {}
			}
			function f() {
				function f() {}
				function a() {}
			}
			function a() {
				function a() {}
			}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:f}': {
					type: ProgramStructureTreeType.FunctionDeclaration,
					children: {
						'{function:f}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
							children: {
								'{function:f}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								}
							}
						},
						'{function:f:1}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
							children: {
								'{function:f}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								}
							}
						}
					}
				},
				'{function:f:1}': {
					type: ProgramStructureTreeType.FunctionDeclaration,
					children: {
						'{function:f}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
							children: {
								'{function:f}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								},
								'{function:a}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								}
							}
						},
						'{function:f:1}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
							children: {
								'{function:f}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								},
								'{function:a}': {
									type: ProgramStructureTreeType.FunctionDeclaration
								}
							}
						},
						'{function:a}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
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
