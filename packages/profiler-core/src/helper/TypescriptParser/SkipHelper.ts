import * as ts from 'typescript'

import { TraverseNodeInfo } from './TraverseNodeInfo'

export class SkipHelper {
	static nodeShouldBeSkipped(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		currentTraverseNodeInfo: TraverseNodeInfo,
		depth: number
	): TraverseNodeInfo | undefined {
		if (node.parent === undefined) {
			return undefined
		}
		// skip awaiter
		if (node.parent.kind === ts.SyntaxKind.CallExpression) {
			if ((node.parent as ts.CallExpression).expression.kind === ts.SyntaxKind.Identifier) {
				if (((node.parent as ts.CallExpression).expression as ts.Identifier).escapedText === '___awaiter') {
					/**
					 * the actual function is wrapped into an generated ___awaiter call like this:
					 * async function test() { console.log('') }
					 * transpiles sometimes to:
					 * test() {
					 * 		__awaiter(this, void 0, void 0, function* () { console.log('') })
					 * }
					 *
					 * Since the actual function is now wrapped into a call expression,
					 * this will result in a hierarchy like this:
					 * - function:test
					 * 		- functionExpression:anonymous
					 *
					 * since this happens only through the transpiling
					 * we ignore this functionExpression to keep the hierarchy like:
					 * - function:test
					 *
					 */
					return currentTraverseNodeInfo
				}
			}
		}

		// skip commonjs module wrapper
		if (depth === 3 && node.kind === ts.SyntaxKind.FunctionExpression) {
			if ((node as ts.FunctionExpression).parameters.length === 5) {
				if (
					((node as ts.FunctionExpression).parameters[0].name as ts.Identifier)
						.escapedText === 'exports' &&
					((node as ts.FunctionExpression).parameters[1].name as ts.Identifier)
						.escapedText === 'require' &&
					((node as ts.FunctionExpression).parameters[2].name as ts.Identifier)
						.escapedText === 'module' &&
					((node as ts.FunctionExpression).parameters[3].name as ts.Identifier)
						.escapedText === '___filename' &&
					((node as ts.FunctionExpression).parameters[4].name as ts.Identifier)
						.escapedText === '___dirname'
				) {
					/**
					 * This is how CommonJS wraps modules.
					 * We need to skip this function expression to keep the hierarchy clean.
					 */
					return currentTraverseNodeInfo
				}
			}
		}
		// skip jest module wrapper
		if (depth === 6 && node.kind === ts.SyntaxKind.Block) {
			if (node.parent.kind === ts.SyntaxKind.FunctionExpression) {
				const parent = node.parent as ts.FunctionExpression
				if (parent.parameters.length === 6) {
					if (
						(parent.parameters[0].name as ts.Identifier)
							.escapedText === 'module' &&
						(parent.parameters[1].name as ts.Identifier)
							.escapedText === 'exports' &&
						(parent.parameters[2].name as ts.Identifier)
							.escapedText === 'require' &&
						(parent.parameters[3].name as ts.Identifier)
							.escapedText === '___dirname' &&
						(parent.parameters[4].name as ts.Identifier)
							.escapedText === '___filename' &&
						(parent.parameters[5].name as ts.Identifier)
							.escapedText === 'jest'
					) {
						/**
						 * This is how jest wraps modules.
						 * We need to skip all parent nodes until the root node to keep the hierarchy clean.
						 */
						return currentTraverseNodeInfo.root
					}
				}
			}
		}

		return undefined
	}
}
