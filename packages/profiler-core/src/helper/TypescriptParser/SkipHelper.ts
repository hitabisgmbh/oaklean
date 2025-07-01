import * as ts from 'typescript'

export class SkipHelper {
	static nodeShouldBeSkipped(
		node: ts.Node
	): boolean {
		if (ts.isCallExpression(node)) {
			if (ts.isIdentifier(node.expression)) {
				if (node.expression.escapedText === '___awaiter') {
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
					 * we ignore the next call expression to keep the hirachy like:
					 * - function:test
					 * 
					 */
					return true
				}
			}
		}
		return false
	}
}