import {
	RootRegex,
	MethodDefinitionRegex,
	ClassDeclarationRegex,
	FunctionDeclarationRegex,
	FunctionExpressionRegex,
	ConstructorDeclarationRegex,
	SourceNodeIdentifierPartRegex
} from '../constants/SourceNodeRegex'
// Types
import {
	ProgramStructureTreeType
} from '../types/model/ProgramStructureTree'
import {
	SourceNodeIdentifier_string,
	SourceNodeIdentifierPart_string
} from '../types/SourceNodeIdentifiers'

export class SourceNodeIdentifierHelper {
	static split(identifier: SourceNodeIdentifier_string): SourceNodeIdentifierPart_string[] {
		if (identifier[0] && identifier[0] === '{') {
			// case SourceNodeIdentifier {}.{}...
			return identifier.split('.') as SourceNodeIdentifierPart_string[]
		}
		// case RegExp:
		return [identifier] as unknown as SourceNodeIdentifierPart_string[]
	}

	static join(identifierParts: SourceNodeIdentifierPart_string[]): SourceNodeIdentifier_string {
		return identifierParts.join('.') as SourceNodeIdentifier_string
	}

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
}