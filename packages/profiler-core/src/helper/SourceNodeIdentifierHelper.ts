import {
	RootRegex,
	MethodDefinitionRegex,
	ClassDeclarationRegex,
	FunctionDeclarationRegex,
	FunctionExpressionRegex,
	ConstructorDeclarationRegex,
	SourceNodeIdentifierPartRegex,
	SourceNodeIdentifierPathRegexString,
	ObjectLiteralExpressionRegex,
	IfStatementRegex,
	SwitchStatementRegex,
	ClassExpressionRegex,
	IfThenStatementRegex,
	IfElseStatementRegex,
	SwitchCaseClauseRegex,
	ModuleDeclarationRegex
} from '../constants/SourceNodeRegex'
// Types
import {
	ProgramStructureTreeType
} from '../types/model/ProgramStructureTree'
import {
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string
} from '../types/SourceNodeIdentifiers'

const SourceNodeIdentifierPathRegex_match = new RegExp(`{${SourceNodeIdentifierPathRegexString}}`, 'g')

const REGEX_PER_PST_TYPE: Record<ProgramStructureTreeType, RegExp> = {
	[ProgramStructureTreeType.Root]: RootRegex,
	[ProgramStructureTreeType.ConstructorDeclaration]: ConstructorDeclarationRegex,
	[ProgramStructureTreeType.ClassDeclaration]: ClassDeclarationRegex,
	[ProgramStructureTreeType.ClassExpression]: ClassExpressionRegex,
	[ProgramStructureTreeType.MethodDefinition]: MethodDefinitionRegex,
	[ProgramStructureTreeType.FunctionDeclaration]: FunctionDeclarationRegex,
	[ProgramStructureTreeType.FunctionExpression]: FunctionExpressionRegex,
	[ProgramStructureTreeType.ObjectLiteralExpression]: ObjectLiteralExpressionRegex,
	[ProgramStructureTreeType.IfStatement]: IfStatementRegex,
	[ProgramStructureTreeType.IfThenStatement]: IfThenStatementRegex,
	[ProgramStructureTreeType.IfElseStatement]: IfElseStatementRegex,
	[ProgramStructureTreeType.SwitchStatement]: SwitchStatementRegex,
	[ProgramStructureTreeType.SwitchCaseClause]: SwitchCaseClauseRegex,
	[ProgramStructureTreeType.ModuleDeclaration]: ModuleDeclarationRegex,
}

export class SourceNodeIdentifierHelper {
	static split(identifier: SourceNodeIdentifier_string): SourceNodeIdentifierPart_string[] {
		if (identifier[0] && identifier[0] === '{') {
			// case SourceNodeIdentifier {}.{}...
			const matches = identifier.match(SourceNodeIdentifierPathRegex_match)
			return (matches ? matches : []) as SourceNodeIdentifierPart_string[]

			//return identifier.split('.') as SourceNodeIdentifierPart_string[]
		}
		// case RegExp:
		return [identifier] as unknown as SourceNodeIdentifierPart_string[]
	}

	static join(identifierParts: SourceNodeIdentifierPart_string[]): SourceNodeIdentifier_string {
		return identifierParts.join('.') as SourceNodeIdentifier_string
	}

	/**
	 * Validates if the given identifier part is a valid source node identifier part.
	 * Important! Does not validate node internal source node identifiers.
	 * 
	 * @returns wether the identifier part is valid or not
	 */
	static validateSourceNodeIdentifierPart(identifierPart: SourceNodeIdentifierPart_string) {
		return (RootRegex.test(identifierPart) || SourceNodeIdentifierPartRegex.test(identifierPart))
	}

	static parseSourceNodeIdentifierPart(
		identifierPart: SourceNodeIdentifierPart_string
	): { type: ProgramStructureTreeType, name: string } | null {
		for (const [type, regex] of Object.entries(REGEX_PER_PST_TYPE)) {
			const match = identifierPart.match(regex)
			if (match && match[1]) {
				return {
					type: type as ProgramStructureTreeType,
					name: match[1]
				}
			}
		}
		return null
	}

	static functionNameToSourceNodeIdentifier(functionName: string): SourceNodeIdentifier_string {
		const chunks = []

		let chunk = ''
		let lastChar = ''
		for (const char of functionName) {
			if (char === '.') {
				if (lastChar === '.') {
					chunk += char
				} else {
					chunks.push(`{${chunk}}`)
					chunk = ''
				}
			} else {
				chunk += char
			}
			lastChar = char
		}
		chunks.push(`{${chunk}}`)
		return chunks.join('.') as SourceNodeIdentifier_string
	}
}