import {
	SourceNodeIdentifierHelper
} from '../../src/helper/SourceNodeIdentifierHelper'
import {
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string
} from '../../src/types/SourceNodeIdentifiers'
import {
	ProgramStructureTreeType
} from '../../src/types/model/ProgramStructureTree'

const EXAMPLE_IDENTIFIER = '{root}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}' as SourceNodeIdentifier_string
const EXAMPLE_IDENTIFIER_PARTS = [
	'{root}',
	'{class:ExampleClass}',
	'{method:memberFunction1}',
	'{function:nestedFunction}',
	'{functionExpression:arrowFunction}'
] as SourceNodeIdentifierPart_string[]

const EXAMPLE_IDENTIFIER_PARTS_PER_TYPE:
Record<
string,
ProgramStructureTreeType | null
> = {
	'{root}': ProgramStructureTreeType.Root,
	'{class:ExampleClass}': ProgramStructureTreeType.ClassDeclaration,
	'{method:memberFunction1}': ProgramStructureTreeType.MethodDefinition,
	'{function:nestedFunction}': ProgramStructureTreeType.FunctionDeclaration,
	'{functionExpression:arrowFunction}': ProgramStructureTreeType.FunctionExpression,
	'invalidPart': null
}

const EXAMPLE_IDENTIFIER_REGEXP = 'RegExp: ^\\s*([^\\s"\'<>/=]+)(?:\\s*((?:=))[ \\t\\n\\f\\r]*(?:"([^"]*)"+|\'([^\']*)\'+|([^ \\t\\n\\f\\r"\'`=<>]+)))?' as SourceNodeIdentifier_string
const EXAMPLE_IDENTIFIER_REGEXP_PARTS = [
	EXAMPLE_IDENTIFIER_REGEXP as unknown
] as SourceNodeIdentifierPart_string[]

const SPECIAL_CASES: {
	functionName: string,
	identifier: SourceNodeIdentifier_string,
	parts: SourceNodeIdentifierPart_string[],
}[] = [
	{
		functionName: 'Module._extensions..js',
		identifier: '{Module}.{_extensions}.{.js}' as SourceNodeIdentifier_string,
		parts: ['{Module}', '{_extensions}', '{.js}'] as SourceNodeIdentifierPart_string[]
	}
]

describe('SourceNodeIdentifierHelper', () => {
	describe('split', () => {
		test('should split a SourceNodeIdentifier string into parts', () => {
			const result = SourceNodeIdentifierHelper.split(EXAMPLE_IDENTIFIER)
			expect(result).toEqual(EXAMPLE_IDENTIFIER_PARTS)
		})
		test('should handle a case with a single part', () => {
			const result = SourceNodeIdentifierHelper.split(EXAMPLE_IDENTIFIER_REGEXP)
			expect(result).toEqual(EXAMPLE_IDENTIFIER_REGEXP_PARTS)
		})

		test('should handle special cases', () => {
			for (const { identifier, parts} of SPECIAL_CASES) {
				const result = SourceNodeIdentifierHelper.split(identifier)
				expect(result).toEqual(parts)
			}
		})
	})

	describe('join', () => {
		test('should join SourceNodeIdentifier parts into a string', () => {
			const result = SourceNodeIdentifierHelper.join(EXAMPLE_IDENTIFIER_PARTS)
			expect(result).toEqual(EXAMPLE_IDENTIFIER)
		})
		test('should handle a case with a single part', () => {
			const result = SourceNodeIdentifierHelper.join(EXAMPLE_IDENTIFIER_REGEXP_PARTS)
			expect(result).toEqual(EXAMPLE_IDENTIFIER_REGEXP)
		})

		test('should handle special cases', () => {
			for (const { identifier, parts} of SPECIAL_CASES) {
				const result = SourceNodeIdentifierHelper.join(parts)
				expect(result).toEqual(identifier)
			}
		})
	})

	describe('validateSourceNodeIdentifierPart', () => {
		test('should validate a valid identifier part', () => {
			for (const part of EXAMPLE_IDENTIFIER_PARTS) {
				const result = SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(part)
				expect(result).toBe(true)
			}
		})

		test('should validate a valid identifier part with RegExp', () => {
			const result = SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(EXAMPLE_IDENTIFIER_PARTS[0])
			expect(result).toBe(true)
		})

		test('should invalidate an invalid identifier part', () => {
			const result = SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart('invalidPart' as SourceNodeIdentifierPart_string)
			expect(result).toBe(false)
		})
	})

	describe('getTypeOfSourceNodeIdentifierPart', () => {
		test('should return the correct type for a valid identifier part', () => {
			for (const [identifierPart, type] of Object.entries(EXAMPLE_IDENTIFIER_PARTS_PER_TYPE)) {
				const result = SourceNodeIdentifierHelper.getTypeOfSourceNodeIdentifierPart(
					identifierPart as SourceNodeIdentifierPart_string
				)
				expect(result).toBe(type)
			}
		})

		test('should return null for an invalid identifier part', () => {
			const result = SourceNodeIdentifierHelper.getTypeOfSourceNodeIdentifierPart('invalidPart' as SourceNodeIdentifierPart_string)
			expect(result).toBeNull()
		})
	})

	describe('functionNameToSourceNodeIdentifier', () => {
		test('should convert a function name to a SourceNodeIdentifier', () => {
			const functionName = 'Module.require'
			const result = SourceNodeIdentifierHelper.functionNameToSourceNodeIdentifier(functionName)
			expect(result).toBe('{Module}.{require}')
		})

		test('should handle special cases', () => {
			for (const { functionName, identifier} of SPECIAL_CASES) {
				const result = SourceNodeIdentifierHelper.functionNameToSourceNodeIdentifier(functionName)
				expect(result).toEqual(identifier)
			}
		})
	})
})