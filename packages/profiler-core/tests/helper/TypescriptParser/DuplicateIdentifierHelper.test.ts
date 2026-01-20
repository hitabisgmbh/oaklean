import ts from 'typescript'

import { ProgramStructureTree } from '../../../src/model/ProgramStructureTree'
import { DuplicateIdentifierHelper } from '../../../src/helper/TypescriptParser'
import { HANDLE_DUPLICATE_IDENTIFIERS } from '../../../src/helper/TypescriptParser/TypescriptParser'
// Types
import { IdentifierType, ProgramStructureTreeType, SourceNodeIdentifierPart_string } from '../../../src/types'

const identifiers: Record<
	keyof typeof HANDLE_DUPLICATE_IDENTIFIERS,
	{
		input: SourceNodeIdentifierPart_string
		duplicateFormat: SourceNodeIdentifierPart_string
	}[]
> = {
	[ProgramStructureTreeType.FunctionDeclaration]: [
		{
			input: '{function:f}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{function:f:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.MethodDefinition]: [
		{
			input: '{method:m}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{method:m:{counter}}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{method@static:m}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{method@static:m:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.GetAccessorDeclaration]: [
		{
			input: '{get:g}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{get:g:{counter}}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{get@static:g}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{get@static:g:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.SetAccessorDeclaration]: [
		{
			input: '{set:s}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{set:s:{counter}}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{set@static:s}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{set@static:s:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.FunctionExpression]: [
		{
			input: '{functionExpression:fe}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{functionExpression:fe:{counter}}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{functionExpression@static:fe}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{functionExpression@static:fe:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.ClassExpression]: [
		{
			input: '{classExpression:ce}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{classExpression:ce:{counter}}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{classExpression@static:ce}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{classExpression@static:ce:{counter}}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.ObjectLiteralExpression]: [
		{
			input: '{scope:(obj:obj)}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{scope:(obj:obj:{counter})}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{scope:(obj@static:(expression:34832631))}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{scope:(obj@static:(expression:34832631):{counter})}' as SourceNodeIdentifierPart_string
		}
	],
	[ProgramStructureTreeType.SwitchCaseClause]: [
		{
			input: '{scope:(case:default)}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{scope:(case:default:{counter})}' as SourceNodeIdentifierPart_string
		},
		{
			input: '{scope:(case:34832631)}' as SourceNodeIdentifierPart_string,
			duplicateFormat: '{scope:(case:34832631:{counter})}' as SourceNodeIdentifierPart_string
		}
	]
}

describe('handle duplicate identifier', () => {
	for (const pstType of Object.keys(HANDLE_DUPLICATE_IDENTIFIERS)) {
		const testExamples = identifiers[pstType as keyof typeof HANDLE_DUPLICATE_IDENTIFIERS]
		expect(testExamples).toBeDefined()

		describe(pstType, () => {
			for (const testCase of testExamples) {
				const { input, duplicateFormat } = testCase

				describe(input, () => {
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

					test('n duplicates', () => {
						for (let i = 0; i < 10; i++) {
							const duplicateChild = new ProgramStructureTree(
								root,
								2,
								pstType as ProgramStructureTreeType,
								IdentifierType.Name,
								input,
								{
									line: 4,
									column: 1
								},
								{
									line: 5,
									column: 1
								}
							)
							DuplicateIdentifierHelper.handleDuplicateIdentifier(duplicateChild, {
								parent: {
									kind: ts.SyntaxKind.SourceFile
								}
							} as unknown as ts.Node)
							expect(duplicateChild.identifier).toBe(
								duplicateFormat.replace('{counter}', `${i + 1}`) as SourceNodeIdentifierPart_string
							)
							root.addChildren(duplicateChild)
						}
					})
				})
			}
		})
	}
})
