import * as ts from 'typescript'

import { Crypto } from '../../system/Crypto'

const printer = ts.createPrinter({ removeComments: true })

export class ExpressionHelper {
	static hashExpression(expression: ts.Expression, sourceFile: ts.SourceFile): string {
		const expressionString = printer.printNode(ts.EmitHint.Expression, expression, sourceFile)
		return Crypto.smallHash(expressionString)
	}
}
