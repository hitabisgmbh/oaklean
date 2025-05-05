const ComputedPropertyName = 'Computed' + 'Property' + 'Name'

class FunctionExpression {
	[key: string | number | symbol]: any;

	constructor(arg: any) {}

	// ts.SyntaxKind.PrivateIdentifier
	#private = function() {}

	// ts.SyntaxKind.PropertyDeclaration
	PropertyDeclaration = function() {};

	// ts.SyntaxKind.FirstLiteralToken
	42 = function() {};

	// ts.SyntaxKind.StringLiteral
	'StringLiteral' = function() {};

	// ts.SyntaxKind.ComputedPropertyName
	[ComputedPropertyName] = function() {};
}

// ts.SyntaxKind.ArrowFunction
const ArrowFunction = () => function() {}

// ts.SyntaxKind.ExportAssignment
export = function() {}

// ts.SyntaxKind.VariableDeclaration
const VariableDeclaration = function() {}

// ts.SyntaxKind.ParenthesizedExpression
;(function() {})()

// ts.SyntaxKind.PropertyAssignment
const obj = { method: function () {} }

// ts.SyntaxKind.CallExpression
typeof(function () {})

let x
// ts.SyntaxKind.BinaryExpression
if(x = function () {}) {}

// ts.SyntaxKind.ArrayLiteralExpression
;[function () {}, 42]

// ts.SyntaxKind.ConditionalExpression
true ? function () {} : null

function ReturnStatement() {
	// ts.SyntaxKind.ReturnStatement
	return function () {}
}

// ts.SyntaxKind.JsxExpression
<div>{function() {} }</div>

// ts.SyntaxKind.NewExpression
new FunctionExpression(function() {})

// ts.SyntaxKind.ThrowStatement

throw function() {}