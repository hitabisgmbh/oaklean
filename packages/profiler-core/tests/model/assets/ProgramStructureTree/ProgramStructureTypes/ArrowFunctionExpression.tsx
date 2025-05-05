const ComputedPropertyName = 'Computed' + 'Property' + 'Name'

class ArrowFunctionExpression {
	[key: string | number | symbol]: any;

	constructor(arg: any) {}

	// ts.SyntaxKind.PrivateIdentifier
	#private = () => {}

	// ts.SyntaxKind.PropertyDeclaration
	PropertyDeclaration = () => {};

	// ts.SyntaxKind.FirstLiteralToken
	42 = () => {};

	// ts.SyntaxKind.StringLiteral
	'StringLiteral' = () => {};

	// ts.SyntaxKind.ComputedPropertyName
	[ComputedPropertyName] = () => {};
}

// ts.SyntaxKind.ArrowFunction
const ArrowFunction = () => () => {}

// ts.SyntaxKind.ExportAssignment
export = () => {}

// ts.SyntaxKind.VariableDeclaration
const VariableDeclaration = () => {}

// ts.SyntaxKind.ParenthesizedExpression
;(() => {})()

// ts.SyntaxKind.PropertyAssignment
const obj = { method: () => {} }

// ts.SyntaxKind.CallExpression
typeof(() => {})

let x
// ts.SyntaxKind.BinaryExpression
if(x = () => {}) {}

// ts.SyntaxKind.ArrayLiteralExpression
;[() => {}, 42]

// ts.SyntaxKind.ConditionalExpression
true ? () => {} : null

function ReturnStatement() {
	// ts.SyntaxKind.ReturnStatement
	return () => {}
}

// ts.SyntaxKind.JsxExpression
<div>{() => {}}</div>

// ts.SyntaxKind.NewExpression
new ArrowFunctionExpression(() => {})

// ts.SyntaxKind.ThrowStatement
throw () => {}