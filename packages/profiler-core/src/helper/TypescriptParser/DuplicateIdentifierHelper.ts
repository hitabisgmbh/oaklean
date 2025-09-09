import * as ts from 'typescript'

import { ProgramStructureTree } from '../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../types'

export class DuplicateIdentifierHelper {
	static handleDuplicateIdentifier(
		tree: ProgramStructureTree,
		node: ts.Node
	): boolean {
		const currentIdentifier = tree.identifier

		if (!currentIdentifier.endsWith('}')) {
			throw new Error(
				'DuplicateIdentifierHelper (handleDuplicateIdentifier): invalid identifier format: ' +
				currentIdentifier
			)
		}

		function isDeclaredViaVar(node: ts.Node) {
			if (node.parent.kind === ts.SyntaxKind.VariableDeclaration) {
				if (
					(node.parent as ts.VariableDeclaration).parent.kind ===
					ts.SyntaxKind.VariableDeclarationList
				) {
					const flags = (
						(node.parent as ts.VariableDeclaration).parent as ts.VariableDeclarationList
					).flags
					if (flags & ts.NodeFlags.Let) {
						return false
					}
					if (flags & ts.NodeFlags.Const) {
						return false
					}
					return true
				}
			}
		}

		let duplicatesAreExpected = true
		if (
			(
				tree.type === ProgramStructureTreeType.FunctionExpression ||
				tree.type === ProgramStructureTreeType.ClassExpression ||
				tree.type === ProgramStructureTreeType.ObjectLiteralExpression
			) &&
			(tree.parent === null || (
				tree.parent.type !== ProgramStructureTreeType.ObjectLiteralExpression &&
				tree.parent.type !== ProgramStructureTreeType.ClassExpression &&
				tree.parent.type !== ProgramStructureTreeType.ClassDeclaration &&
				!isDeclaredViaVar(node)
			))
		) {
			// they should only have duplicate occurrences inside:
			// object literals, classes or when declared via var
			duplicatesAreExpected = false
		}

		if (
			tree.type === ProgramStructureTreeType.ObjectLiteralExpression ||
			tree.type === ProgramStructureTreeType.SwitchCaseClause
		) {
			if (!currentIdentifier.endsWith(')}')) {
				throw new Error(
					'DuplicateIdentifierHelper (handleDuplicateIdentifier): invalid identifier format: ' +
					currentIdentifier
				)
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

		return duplicatesAreExpected
	}
}