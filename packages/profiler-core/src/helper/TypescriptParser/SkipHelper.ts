import * as ts from 'typescript'

export class SkipHelper {
	static nodeShouldBeSkipped(
		node: ts.Node,
		sourceFile: ts.SourceFile
	): boolean {
		if (node.parent === undefined) {
			return false
		}
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
					return true
				}
			}
		}

		if (node.kind === ts.SyntaxKind.FunctionExpression && node.parent?.parent?.parent === sourceFile) {
			if ((node as ts.FunctionExpression).parameters.length === 5) {
				if (
					((node as ts.FunctionExpression).parameters[0].name as ts.Identifier).escapedText === 'exports' &&
					((node as ts.FunctionExpression).parameters[1].name as ts.Identifier).escapedText === 'require' &&
					((node as ts.FunctionExpression).parameters[2].name as ts.Identifier).escapedText === 'module' &&
					((node as ts.FunctionExpression).parameters[3].name as ts.Identifier).escapedText === '___filename' &&
					((node as ts.FunctionExpression).parameters[4].name as ts.Identifier).escapedText === '___dirname'
				) {
					/**
					 * This is how CommonJS wraps modules.
					 * We need to skip this function expression to keep the hierarchy clean.
					 */
					return true
				}
			}
		}
		return false
	}
}