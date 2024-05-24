import * as fs from 'fs'

import { SourceNodeIdentifier_string } from '../../src/types/SourceNodeIdentifiers.types'
import { ProgramStructureTree } from '../../src/model/ProgramStructureTree'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { TypescriptParser } from '../../src/helper/TypescriptParser'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('ProgramStructureTree', () => {
	describe('instance related', () => {
		let instance: ProgramStructureTree

		beforeEach(() => {
			const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.js')
			instance = TypescriptParser.parseFile(testFile)
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
			const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.expected.json')
			const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())
			expect(instance.toJSON()).toEqual(expected)
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
					line: 3,
					column: 4
				})).toBe('{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}')
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
		const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.expected.json')
		const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())

		test('deserialization from string', () => {			
			const instanceFromString = ProgramStructureTree.fromJSON(JSON.stringify(expected))
			expect(JSON.stringify(instanceFromString)).toEqual(JSON.stringify(expected))
		})

		test('deserialization from object', () => {
			const instanceFromObject = ProgramStructureTree.fromJSON(expected)
			expect(JSON.stringify(instanceFromObject)).toEqual(JSON.stringify(expected))
		})
	})
})

describe('testing with typescript file parser', () => {
	test('test case 1', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'nestedDeclarations.js')
		const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'nestedDeclarations.expected.json')

		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseFile(testFile)))
		const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())

		expect(tree).toEqual(expected)
	})

	test('test case 2: MethodDefinition', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.js')
		const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.expected.json')

		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseFile(testFile)))

		const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())

		expect(tree).toEqual(expected)
	})
})

describe('testing with typescript string parser', () => {
	test('test case 1', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'nestedDeclarations.js')
		const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'nestedDeclarations.expected.json')
		const sourceCode = fs.readFileSync(testFile.toString()).toString()

		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseSource(testFile, sourceCode)))
		const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())

		expect(tree).toEqual(expected)
	})

	test('test case 2: MethodDefinition', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.js')
		const expectedFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.expected.json')
		const sourceCode = fs.readFileSync(testFile.toString()).toString()

		const tree = JSON.parse(JSON.stringify(TypescriptParser.parseSource(testFile, sourceCode)))

		const expected = JSON.parse(fs.readFileSync(expectedFile.toString()).toString())

		expect(tree).toEqual(expected)
	})
})

describe('ProgramStructureTreeType.identifierBySourceLocation', () => {
	test('test case 1', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.js')

		const tree = TypescriptParser.parseFile(testFile)

		expect(tree.identifierBySourceLocation({ line: 23, column: 26 })).toBe('{root}.{class:Child}.{functionExpression:arrowFunction}')

		expect(tree.identifierBySourceLocation({ line: 5, column: 4 })).toBe('{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:2)}')
		
		expect(tree.identifierBySourceLocation({ line: 31, column: 24 })).toBe('{root}.{class:Child}.{method:asyncMethod}')
	})
})

describe('ProgramStructureTreeType.sourceLocationOfIdentifier', () => {
	test('test case 1', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'MethodDefinition.js')

		const tree = TypescriptParser.parseFile(testFile)

		expect(tree.sourceLocationOfIdentifier('{root}.{class:Child}.{functionExpression:arrowFunction}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 23, column: 18 },
			endLoc: { line: 25, column: 3 },
		})

		expect(tree.sourceLocationOfIdentifier('{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:2)}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 5, column: 4 },
			endLoc: { line: 5, column: 12 },
		})

		expect(tree.sourceLocationOfIdentifier('{root}.{class:Child}.{method:asyncMethod}' as SourceNodeIdentifier_string)).toEqual({
			beginLoc: { line: 31, column: 2 },
			endLoc: { line: 33, column: 3 },
		})
	})

	test('EmitHelpers', () => {
		const testFile = CURRENT_DIR.join('assets', 'ProgramStructureTree', 'EmitHelpers.js')

		const tree = TypescriptParser.parseFile(testFile)

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