import { ProgramStructureTree } from '../../../src/model/ProgramStructureTree'
import { DuplicateIdentifierHelper, TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import {
	IdentifierType,
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../../src/types'

describe('exports', () => {
	describe('ts.SyntaxKind.DefaultKeyword', () => {
		describe('without function name', () => {
			const code = `
				export default function () {}
			`

			test('expected identifier', () => {
				const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{function:default}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
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
				const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

				const hierarchy = pst.identifierHierarchy()

				expect(hierarchy).toEqual({
					type: ProgramStructureTreeType.Root,
					children: {
						'{function:DefaultKeyword}': {
							type: ProgramStructureTreeType.FunctionDeclaration,
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
					type: ProgramStructureTreeType.FunctionDeclaration,
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
					type: ProgramStructureTreeType.FunctionDeclaration,
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
					type: ProgramStructureTreeType.FunctionDeclaration,
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
					type: ProgramStructureTreeType.FunctionDeclaration,
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
		ProgramStructureTreeType.FunctionDeclaration,
		IdentifierType.Name,
		'{function:f}' as SourceNodeIdentifierPart_string,
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
				'{function:f}' as SourceNodeIdentifierPart_string,
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
			expect(duplicateChild.identifier).toBe(`{function:f:${i+1}}` as SourceNodeIdentifierPart_string)

			root.children.set(duplicateChild.identifier, duplicateChild)
		}
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
										type: ProgramStructureTreeType.FunctionDeclaration,
									}
								}
							},
							'{function:f:1}': {
								type: ProgramStructureTreeType.FunctionDeclaration,
								children: {
									'{function:f}': {
										type: ProgramStructureTreeType.FunctionDeclaration,
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
										type: ProgramStructureTreeType.FunctionDeclaration,
									},
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration,
									}
								}
							},
							'{function:f:1}': {
								type: ProgramStructureTreeType.FunctionDeclaration,
								children: {
									'{function:f}': {
										type: ProgramStructureTreeType.FunctionDeclaration,
									},
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration,
									}
								}
							},
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration,
								children: {
									'{function:a}': {
										type: ProgramStructureTreeType.FunctionDeclaration,
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