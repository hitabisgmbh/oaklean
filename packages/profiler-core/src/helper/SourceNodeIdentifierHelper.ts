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

	static join(SourceNodeIdentifierParts: SourceNodeIdentifierPart_string[]): SourceNodeIdentifier_string {
		return SourceNodeIdentifierParts.join('.') as SourceNodeIdentifier_string
	}
}