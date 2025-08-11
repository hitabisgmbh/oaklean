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
		if (ts.isCallExpression(node.parent)) {
			if (ts.isIdentifier(node.parent.expression)) {
				if (node.parent.expression.escapedText === '___awaiter') {
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

		return undefined
	}
}
