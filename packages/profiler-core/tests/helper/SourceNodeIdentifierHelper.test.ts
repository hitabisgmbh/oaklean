import { SourceNodeIdentifierHelper } from '../../src/helper/SourceNodeIdentifierHelper'
import {
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string
} from '../../src/types/SourceNodeIdentifiers'
import { ProgramStructureTreeType } from '../../src/types/model/ProgramStructureTree'

const EXAMPLE_IDENTIFIER =
	'{root}.{scope:(namespace:A_1.B_2:0)}.{class:ExampleClass}.{method:memberFunction1}.{function:nestedFunction}.{functionExpression:arrowFunction}' as SourceNodeIdentifier_string
const EXAMPLE_IDENTIFIER_PARTS = [
	'{root}',
	'{scope:(namespace:A_1.B_2:0)}',
	'{class:ExampleClass}',
	'{method:memberFunction1}',
	'{function:nestedFunction}',
	'{functionExpression:arrowFunction}'
] as SourceNodeIdentifierPart_string[]

const EXAMPLE_IDENTIFIER_PARTS_PER_TYPE: Record<
	ProgramStructureTreeType,
	{
		input: string
		expectedName?: string
	}
> = {
	[ProgramStructureTreeType.Root]: {
		input: '{root}',
		expectedName: 'root'
	},
	[ProgramStructureTreeType.ClassDeclaration]: {
		input: '{class:ExampleClass}',
		expectedName: 'ExampleClass'
	},
	[ProgramStructureTreeType.ClassExpression]: {
		input: '{classExpression@static:(anonymous:1234):1}',
		expectedName: '(anonymous:1234):1'
	},
	[ProgramStructureTreeType.MethodDefinition]: {
		input: '{method@static:memberFunction1:1}',
		expectedName: 'memberFunction1:1'
	},
	[ProgramStructureTreeType.GetAccessorDeclaration]: {
		input: '{get@static:a:1}',
		expectedName: 'a:1'
	},
	[ProgramStructureTreeType.SetAccessorDeclaration]: {
		input: '{set@static:a:1}',
		expectedName: 'a:1'
	},
	[ProgramStructureTreeType.FunctionDeclaration]: {
		input: '{function:nestedFunction:1}',
		expectedName: 'nestedFunction:1'
	},
	[ProgramStructureTreeType.FunctionExpression]: {
		input: '{functionExpression:arrowFunction:1}',
		expectedName: 'arrowFunction:1'
	},
	[ProgramStructureTreeType.ConstructorDeclaration]: {
		input: '{constructor:constructor}',
		expectedName: 'constructor'
	},
	[ProgramStructureTreeType.ObjectLiteralExpression]: {
		input: '{scope:(obj@static:(anonymous:1234))}',
		expectedName: '(anonymous:1234)'
	},
	[ProgramStructureTreeType.IfStatement]: {
		input: '{scope:(if:0)}',
		expectedName: '(if:0)'
	},
	[ProgramStructureTreeType.IfThenStatement]: {
		input: '{scope:(then)}',
		expectedName: '(then)'
	},
	[ProgramStructureTreeType.IfElseStatement]: {
		input: '{scope:(else)}',
		expectedName: '(else)'
	},
	[ProgramStructureTreeType.ForStatement]: {
		input: '{scope:(for:0)}',
		expectedName: '(for:0)'
	},
	[ProgramStructureTreeType.WhileStatement]: {
		input: '{scope:(while:0)}',
		expectedName: '(while:0)'
	},
	[ProgramStructureTreeType.TryStatement]: {
		input: '{scope:(try:0)}',
		expectedName: '(try:0)'
	},
	[ProgramStructureTreeType.TryBlock]: {
		input: '{scope:(try)}',
		expectedName: '(try)'
	},
	[ProgramStructureTreeType.CatchClause]: {
		input: '{scope:(catch)}',
		expectedName: '(catch)'
	},
	[ProgramStructureTreeType.FinallyBlock]: {
		input: '{scope:(finally)}',
		expectedName: '(finally)'
	},
	[ProgramStructureTreeType.Block]: {
		input: '{scope:(block:0)}',
		expectedName: '(block:0)'
	},
	[ProgramStructureTreeType.ClassStaticBlockDeclaration]: {
		input: '{static:0}',
		expectedName: 'static:0'
	},
	[ProgramStructureTreeType.SwitchStatement]: {
		input: '{scope:(switch:0)}',
		expectedName: '(switch:0)'
	},
	[ProgramStructureTreeType.SwitchCaseClause]: {
		input: '{scope:(case:default:1)}',
		expectedName: '(case:default:1)'
	},
	[ProgramStructureTreeType.ModuleDeclaration]: {
		input: '{scope:(namespace:A_1.B_2:0)}',
		expectedName: 'A_1.B_2'
	}
}

const EXAMPLE_IDENTIFIER_REGEXP =
	'RegExp: ^\\s*([^\\s"\'<>/=]+)(?:\\s*((?:=))[ \\t\\n\\f\\r]*(?:"([^"]*)"+|\'([^\']*)\'+|([^ \\t\\n\\f\\r"\'`=<>]+)))?' as SourceNodeIdentifier_string
const EXAMPLE_IDENTIFIER_REGEXP_PARTS = [
	EXAMPLE_IDENTIFIER_REGEXP as unknown
] as SourceNodeIdentifierPart_string[]

const SPECIAL_CASES: {
	functionName: string
	identifier: SourceNodeIdentifier_string
	parts: SourceNodeIdentifierPart_string[]
}[] = [
	{
		functionName: 'Module._extensions..js',
		identifier: '{Module}.{_extensions}.{.js}' as SourceNodeIdentifier_string,
		parts: [
			'{Module}',
			'{_extensions}',
			'{.js}'
		] as SourceNodeIdentifierPart_string[]
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
			for (const { identifier, parts } of SPECIAL_CASES) {
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
			const result = SourceNodeIdentifierHelper.join(
				EXAMPLE_IDENTIFIER_REGEXP_PARTS
			)
			expect(result).toEqual(EXAMPLE_IDENTIFIER_REGEXP)
		})

		test('should handle special cases', () => {
			for (const { identifier, parts } of SPECIAL_CASES) {
				const result = SourceNodeIdentifierHelper.join(parts)
				expect(result).toEqual(identifier)
			}
		})
	})

	describe('validateSourceNodeIdentifierPart', () => {
		test('should validate a valid identifier part', () => {
			for (const part of EXAMPLE_IDENTIFIER_PARTS) {
				const result =
					SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(part)
				expect(result).toBe(true)
			}
		})

		test('should validate a valid identifier part with RegExp', () => {
			const result =
				SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(
					EXAMPLE_IDENTIFIER_PARTS[0]
				)
			expect(result).toBe(true)
		})

		test('should invalidate an invalid identifier part', () => {
			const result =
				SourceNodeIdentifierHelper.validateSourceNodeIdentifierPart(
					'invalidPart' as SourceNodeIdentifierPart_string
				)
			expect(result).toBe(false)
		})
	})

	describe('parseSourceNodeIdentifierPart', () => {
		describe('should return the correct type for a valid identifier part', () => {
			for (const [type, example] of Object.entries(
				EXAMPLE_IDENTIFIER_PARTS_PER_TYPE
			)) {
				test(type, () => {
					const result =
						SourceNodeIdentifierHelper.parseSourceNodeIdentifierPart(
							example.input as SourceNodeIdentifierPart_string
						)

					expect(result).toEqual({
						type: type as ProgramStructureTreeType,
						name: example.expectedName
					})
				})
			}
		})

		test('should return null for an invalid identifier part', () => {
			const result = SourceNodeIdentifierHelper.parseSourceNodeIdentifierPart(
				'invalidPart' as SourceNodeIdentifierPart_string
			)
			expect(result).toBeNull()
		})
	})

	describe('functionNameToSourceNodeIdentifier', () => {
		test('should convert a function name to a SourceNodeIdentifier', () => {
			const functionName = 'Module.require'
			const result =
				SourceNodeIdentifierHelper.functionNameToSourceNodeIdentifier(
					functionName
				)
			expect(result).toBe('{Module}.{require}')
		})

		test('should handle special cases', () => {
			for (const { functionName, identifier } of SPECIAL_CASES) {
				const result =
					SourceNodeIdentifierHelper.functionNameToSourceNodeIdentifier(
						functionName
					)
				expect(result).toEqual(identifier)
			}
		})
	})
})
