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