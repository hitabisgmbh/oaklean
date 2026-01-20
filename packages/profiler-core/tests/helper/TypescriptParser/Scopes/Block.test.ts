import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('ts.SyntaxKind.Block', () => {
	describe('empty', () => {
		const code = `
			function a {}
			{};
			{};
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
			function a {}
			{};
			{
				function a {}
			};
			{};
			{
				function a {}
			};
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
					'{scope:(block:0)}': {
						type: ProgramStructureTreeType.Block,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					},
					'{scope:(block:1)}': {
						type: ProgramStructureTreeType.Block,
						children: {
							'{function:a}': {
								type: ProgramStructureTreeType.FunctionDeclaration
							}
						}
					}
				}
			})
		})
	})
})
