import { TypescriptParser } from '../../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../../src/types'

describe('__awaiter', () => {
	/**
	 * the __awaiter helper should be skipped in the hierarchy
	 */
	const code = `
		function withAwaiter() {
			__awaiter(this, void 0, void 0, function* () { console.log('') })
		}

		function withoutAwaiter() {
			__nowaiter(this, void 0, void 0, function* () { console.log('') })
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{function:withAwaiter}': {
					type: ProgramStructureTreeType.FunctionDeclaration
				},
				'{function:withoutAwaiter}': {
					type: ProgramStructureTreeType.FunctionDeclaration,
					children: {
						'{functionExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.FunctionExpression
						}
					}
				}
			}
		})
	})
})
