import {
	BASICS_CASE,
	FUNCTION_EXPRESSION_CASE,
	EMIT_HELPER_PATH,
	NESTED_DECLARATIONS_CASE
} from './assets/ProgramStructureTree/index'

import { ProgramStructureTree } from '../../src/model/ProgramStructureTree'
import { TypescriptParser } from '../../src/helper/TypescriptParser'
import {
	IProgramStructureTree,
	SourceNodeIdentifier_string
} from '../../src/types'


describe('ProgramStructureTree', () => {
	describe('instance related', () => {
		let instance: ProgramStructureTree

		beforeEach(() => {
			instance = TypescriptParser.parseFile(NESTED_DECLARATIONS_CASE.source.path)
		})

		it('instance should be an instanceof ProgramStructureTree', () => {
			expect(instance instanceof ProgramStructureTree).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(ProgramStructureTree.fromJSON).toBeTruthy()
		})

		it('should have a method containsLocation()', () => {
			expect(instance.containsLocation).toBeTruthy()
		})

		it('should have a method identifierBySourceLocation()', () => {
			expect(instance.identifierBySourceLocation).toBeTruthy()
		})

		it('should have a method sourceLocationOfIdentifier()', () => {
			expect(instance.sourceLocationOfIdentifier).toBeTruthy()
		})

		it('should serialize correctly', () => {
			expect(instance.toJSON()).toEqual(NESTED_DECLARATIONS_CASE.expected.object)
		})

		test('containsLocation', () => {
			expect(instance.containsLocation({
				line: 1,
				column: -1
			})).toBe(false)

			expect(instance.containsLocation({
				line: 58,
				column: 2
			})).toBe(false)
		})

		describe('identifierBySourceLocation', () => {
			test('existing identifier', () => {
				expect(instance.identifierBySourceLocation({
					line: 8,
					column: 21
				})).toBe('{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}.{functionExpression:d}')
			})

			test('non existing identifier', () => {
				expect(instance.identifierBySourceLocation({
					line: 10000000000,
					column: 10000000000
				})).toBe('')
			})
		})
	})

	describe('deserialization', () => {
		test('deserialization from string', () => {			
			const instanceFromString = ProgramStructureTree.fromJSON(
				FUNCTION_EXPRESSION_CASE.expected.content
			)
			expect(JSON.stringify(instanceFromString)).toEqual(
				JSON.stringify(FUNCTION_EXPRESSION_CASE.expected.object)
			)
		})

		test('deserialization from object', () => {
			const instanceFromObject = ProgramStructureTree.fromJSON(
				FUNCTION_EXPRESSION_CASE.expected.object as IProgramStructureTree
			)
			expect(JSON.stringify(instanceFromObject)).toEqual(
				JSON.stringify(FUNCTION_EXPRESSION_CASE.expected.object)
			)
		})
	})
})

describe('testing with typescript file parser', () => {
	test('test case 2: NESTED_DECLARATIONS_CASE', () => {
		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseFile(
			NESTED_DECLARATIONS_CASE.source.path
		)))
		const expected = JSON.parse(
			NESTED_DECLARATIONS_CASE.expected.content
		)
		expect(tree).toEqual(expected)
	})

	test('test case 2: FUNCTION_EXPRESSION_CASE', () => {
		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseFile(
			FUNCTION_EXPRESSION_CASE.source.path
		)))
		const expected = JSON.parse(
			FUNCTION_EXPRESSION_CASE.expected.content
		)
		expect(tree).toEqual(expected)
	})
})

describe('testing with typescript string parser', () => {
	test('test case 1: NESTED_DECLARATIONS_CASE', () => {
		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseSource(
			NESTED_DECLARATIONS_CASE.source.path,
			NESTED_DECLARATIONS_CASE.source.content
		)))
		const expected = JSON.parse(NESTED_DECLARATIONS_CASE.expected.content)

		expect(tree).toEqual(expected)
	})

	test('test case 2: FUNCTION_EXPRESSION_CASE', () => {
		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseSource(
			FUNCTION_EXPRESSION_CASE.source.path,
			FUNCTION_EXPRESSION_CASE.source.content
		)))
		const expected = JSON.parse(FUNCTION_EXPRESSION_CASE.expected.content)

		expect(tree).toEqual(expected)
	})
})

describe('ProgramStructureTreeType.identifierBySourceLocation', () => {
	test('test case 1', () => {
		const tree = TypescriptParser.parseFile(NESTED_DECLARATIONS_CASE.source.path)

		expect(tree.identifierBySourceLocation({ line: 3, column: 1 })).toBe('{root}.{class:ExampleClass}.{method:memberFunction1}')

		expect(tree.identifierBySourceLocation({ line: 5, column: 3 })).toBe('{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}')
		
		expect(tree.identifierBySourceLocation({ line: 7, column: 21 })).toBe('{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}.{functionExpression:c}')
	})
})

describe('ProgramStructureTreeType.sourceLocationOfIdentifier', () => {
	test('test case 1', () => {
		const tree = TypescriptParser.parseFile(NESTED_DECLARATIONS_CASE.source.path)

		expect(tree.sourceLocationOfIdentifier('{root}.{class:ExampleClass}.{method:memberFunction1}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 2, column: 1 },
			endLoc: { line: 11, column: 2 },
		})

		expect(tree.sourceLocationOfIdentifier('{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 4, column: 25 },
			endLoc: { line: 9, column: 4 },
		})

		expect(tree.sourceLocationOfIdentifier('{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}.{functionExpression:c}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 7, column: 14 },
			endLoc: { line: 7, column: 22 },
		})
	})

	test('EmitHelpers', () => {
		const tree = TypescriptParser.parseFile(EMIT_HELPER_PATH)

		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__decorate}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 46,
				line: 1
			},
			endLoc: {
				column: 1,
				line: 6
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__metadata}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 46,
				line: 7
			},
			endLoc: {
				column: 1,
				line: 9
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__param}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 40,
				line: 10
			},
			endLoc: {
				column: 1,
				line: 12
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__esDecorate}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 50,
				line: 13
			},
			endLoc: {
				column: 1,
				line: 39
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__runInitializers}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 60,
				line: 40
			},
			endLoc: {
				column: 1,
				line: 46
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__assign}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 42,
				line: 47
			},
			endLoc: {
				column: 1,
				line: 57
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__await}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 40,
				line: 58
			},
			endLoc: {
				column: 126,
				line: 58
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__asyncGenerator}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 58,
				line: 59
			},
			endLoc: {
				column: 1,
				line: 69
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__asyncDelegator}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 58,
				line: 70
			},
			endLoc: {
				column: 1,
				line: 74
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__asyncValues}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 52,
				line: 75
			},
			endLoc: {
				column: 1,
				line: 81
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__rest}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 38,
				line: 82
			},
			endLoc: {
				column: 1,
				line: 92
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__awaiter}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 44,
				line: 93
			},
			endLoc: {
				column: 1,
				line: 101
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__extends}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 45,
				line: 102
			},
			endLoc: {
				column: 1,
				line: 117
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__makeTemplateObject}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 66,
				line: 118
			},
			endLoc: {
				column: 1,
				line: 121
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__read}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 38,
				line: 122
			},
			endLoc: {
				column: 1,
				line: 137
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__spreadArray}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 52,
				line: 138
			},
			endLoc: {
				column: 1,
				line: 146
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__propKey}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 44,
				line: 147
			},
			endLoc: {
				column: 1,
				line: 149
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__setFunctionName}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 60,
				line: 150
			},
			endLoc: {
				column: 1,
				line: 153
			}
		})
		expect(
			tree.sourceLocationOfIdentifier(
				'{root}.{functionExpression:__values}' as SourceNodeIdentifier_string
			)
		).toEqual({
			beginLoc: {
				column: 42,
				line: 154
			},
			endLoc: {
				column: 1,
				line: 164
			}
		})
	})
})