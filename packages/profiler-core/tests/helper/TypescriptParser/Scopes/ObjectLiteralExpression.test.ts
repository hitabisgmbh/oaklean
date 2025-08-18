import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'


describe('with no executable children', () => {
	const code = `
		const obj = {}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root
		})
	})
})

describe('with executable children', () => {
	const code = `
		const obj = {
			method() {},
			a: {
				method() {}
			}
		};
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
						'{method:method}': {
							type: ProgramStructureTreeType.MethodDefinition
						},
						'{scope:(obj:a)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('with deep nested executable children', () => {
	const code = `
		const obj = {
			a: {
				method() {},
				c: {}
			},
			b: {
				method() {},
				c: {}
			}
		}
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
						'{scope:(obj:a)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						},
						'{scope:(obj:b)}': {
							type: ProgramStructureTreeType.ObjectLiteralExpression,
							children: {
								'{method:method}': {
									type: ProgramStructureTreeType.MethodDefinition
								}
							}
						}
					}
				}
			}
		})
	})
})