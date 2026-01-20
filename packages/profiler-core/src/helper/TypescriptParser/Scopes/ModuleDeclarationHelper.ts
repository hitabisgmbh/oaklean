import * as ts from 'typescript'

import { NamingHelper } from '../NamingHelper'
import { TypescriptHelper } from '../TypescriptHelper'
import { TraverseNodeInfo } from '../TraverseNodeInfo'
import { ProgramStructureTree } from '../../../model/ProgramStructureTree'
// Types
import {
	ProgramStructureTreeType,
	SourceNodeIdentifierPart_string
} from '../../../types'

export class ModuleDeclarationHelper {
	static syntaxKind = ts.SyntaxKind.ModuleDeclaration

	static parseNode(
		node: ts.ModuleDeclaration,
		sourceFile: ts.SourceFile,
		traverseNodeInfo: TraverseNodeInfo
	): {
		resolve(): ProgramStructureTree<ProgramStructureTreeType.ModuleDeclaration>
	} | null {
		if (node.name.kind !== ts.SyntaxKind.Identifier) {
			// module is a ambient module declaration, no implementation is allowed within it
			// so there cant be any executable code within it
			return null
		}

		if (node.body?.kind === ts.SyntaxKind.ModuleDeclaration) {
			/*
				This is not the last module declaration in the chain

				Example for a module declaration chain:
				module A.B.C {}

				The correct identifier will be determined for the last module declaration in the chain.
			*/
			return null
		}

		return {
			resolve() {
				const { identifier, identifierType } = NamingHelper.getIdentifierName(
					node.name as ts.Identifier,
					sourceFile,
					traverseNodeInfo
				)

				let currentNode: ts.ModuleDeclaration = node
				let identifierChain: string = identifier
				while (currentNode.parent.kind === ts.SyntaxKind.ModuleDeclaration) {
					const newNode = currentNode.parent as ts.ModuleDeclaration
					if (newNode.name.kind !== ts.SyntaxKind.Identifier) {
						// module is a ambient module declaration, no implementation is allowed within it
						// so there cant be any executable code within it
						break
					}
					const { identifier } = NamingHelper.getIdentifierName(
						newNode.name,
						sourceFile,
						traverseNodeInfo
					)
					identifierChain = `${identifier}.${identifierChain}`
					currentNode = newNode
				}

				const identifierCounter =
					traverseNodeInfo.requestModuleIdentificationCounter(identifierChain)

				return new ProgramStructureTree(
					traverseNodeInfo.resolvedTree(),
					traverseNodeInfo.nextId(),
					ProgramStructureTreeType.ModuleDeclaration,
					identifierType,
					`{scope:(namespace:${identifierChain}:${identifierCounter})}` as SourceNodeIdentifierPart_string,
					TypescriptHelper.posToLoc(sourceFile, currentNode.getStart()),
					TypescriptHelper.posToLoc(sourceFile, currentNode.getEnd())
				)
			}
		}
	}
}
