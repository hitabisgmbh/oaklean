import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class DuplicateIdentifierHelper {
	static handleDuplicateIdentifier(
		tree: ProgramStructureTree
	): void {
		const currentIdentifier = tree.identifier

		if (!currentIdentifier.endsWith('}')) {
			throw new Error('DuplicateIdentifierHelper (handleDuplicateIdentifier): invalid identifier format: ' + currentIdentifier)
		}

		if (tree.type === ProgramStructureTreeType.ObjectLiteralExpression) {
			if (!currentIdentifier.endsWith(')}')) {
				throw new Error('DuplicateIdentifierHelper (handleDuplicateIdentifier): invalid identifier format: ' + currentIdentifier)
			}

			const baseIdentifier = currentIdentifier.substring(0, currentIdentifier.length - 2)
			let counter = 1
			while (
				tree.parent !== null &&
				tree.parent.children.has(`${baseIdentifier}:${counter})}` as SourceNodeIdentifierPart_string)
			) {
				counter++
			}
			tree.identifier = `${baseIdentifier}:${counter})}` as SourceNodeIdentifierPart_string
		} else {
			const baseIdentifier = currentIdentifier.substring(0, currentIdentifier.length - 1)
			let counter = 1
			while (
				tree.parent !== null &&
				tree.parent.children.has(`${baseIdentifier}:${counter}}` as SourceNodeIdentifierPart_string)
			) {
				counter++
			}
			tree.identifier = `${baseIdentifier}:${counter}}` as SourceNodeIdentifierPart_string
		}

	}
}