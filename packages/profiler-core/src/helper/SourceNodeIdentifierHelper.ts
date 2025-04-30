import {
	RootRegex,
	MethodDefinitionRegex,
	ClassDeclarationRegex,
	FunctionDeclarationRegex,
	FunctionExpressionRegex,
	ConstructorDeclarationRegex,
	SourceNodeIdentifierPartRegex,
	SourceNodeIdentifierPathRegexString
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

	static getTypeOfSourceNodeIdentifierPart(
		identifierPart: SourceNodeIdentifierPart_string
	): ProgramStructureTreeType | null {
		if (RootRegex.test(identifierPart)) {
			return ProgramStructureTreeType.Root
		}
		if (MethodDefinitionRegex.test(identifierPart)) {
			return ProgramStructureTreeType.MethodDefinition
		}
		if (FunctionDeclarationRegex.test(identifierPart)) {
			return ProgramStructureTreeType.FunctionDeclaration
		}
		if (ClassDeclarationRegex.test(identifierPart)) {
			return ProgramStructureTreeType.ClassDeclaration
		}
		if (FunctionExpressionRegex.test(identifierPart)) {
			return ProgramStructureTreeType.FunctionExpression
		}
		if (ConstructorDeclarationRegex.test(identifierPart)) {
			return ProgramStructureTreeType.ConstructorDeclaration
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