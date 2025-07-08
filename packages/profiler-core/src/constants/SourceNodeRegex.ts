export const SourceNodeNameRegexString = '[a-zA-Z0-9_$#]+'
export const SourceNodeNameExpressionRegexString =
	`(?:${SourceNodeNameRegexString}|\\((?:literal|expression):${SourceNodeNameRegexString}\\))`

export const RootRegexString = '{root}'
export const ConstructorDeclarationRegexString = '{constructor:constructor}'
export const ClassDeclarationRegexString = `{class:${SourceNodeNameRegexString}}`
export const MethodDefinitionRegexString = `{method(?:@static)?:${SourceNodeNameExpressionRegexString}}`
export const FunctionDeclarationRegexString = `{function:${SourceNodeNameExpressionRegexString}}`
export const FunctionExpressionRegexString =
	`{functionExpression:(?:${SourceNodeNameExpressionRegexString}|\\(anonymous:[0-9]+\\))}`
export const ClassExpressionRegexString =
	`{classExpression:(?:${SourceNodeNameExpressionRegexString}|\\(anonymous:[0-9]+\\))}`
// Scopes
export const ExpressionHashRegexString = '[A-Za-z0-9]+'

export const ObjectLiteralExpressionRegexString = '{scope:\\(anonymous:[0-9]+\\)}'
export const IfStatementRegexString = '{scope:(?:then|else|\\(if:[0-9]+\\))}'
// eslint-disable-next-line max-len
export const SwitchStatementRegexString = `{scope:(?:\\(switch:[0-9]+\\)|\\(case:(?:${ExpressionHashRegexString}|default)\\))}`

// eslint-disable-next-line max-len
export const ScopeRegexString = `(?:${ObjectLiteralExpressionRegexString}|${IfStatementRegexString}|${SwitchStatementRegexString})`

export const LangInternalSourceNodeRegExpRegexString = 'RegExp: .*'
export const LangInternalSourceNodeNameRegexString = '[^{}]+'
export const LangInternalSourceNodeIdentifierRegexString =
	'(?:' +
	`{(?:${LangInternalSourceNodeNameRegexString})}` +
	`(?:\\.{|${LangInternalSourceNodeNameRegexString}})*`
	+ `|${LangInternalSourceNodeRegExpRegexString})`

export const SourceNodeIdentifierPathRegexString = '[^{}]+'

// eslint-disable-next-line max-len
export const SourceNodeIdentifierPartRegexString = `(?:${ConstructorDeclarationRegexString}|${ClassDeclarationRegexString}|${MethodDefinitionRegexString}|${FunctionDeclarationRegexString}|${FunctionExpressionRegexString}|${ClassExpressionRegexString}|${ScopeRegexString})`

export const SourceNodeIdentifierRegexString =
	`(?:${RootRegexString}(?:\\.${SourceNodeIdentifierPartRegexString})*` +
	`|${LangInternalSourceNodeIdentifierRegexString})`
export const LangInternalPathRegexString = 'node:(?:[^\\/{}]*)(?:\\/[^\\/{}]*)*'

// Source Node Identifier-Part Regex
export const RootRegex = new RegExp(`^${RootRegexString}$`)
export const MethodDefinitionRegex = new RegExp(`^${MethodDefinitionRegexString}$`)
export const ClassDeclarationRegex = new RegExp(`^${ClassDeclarationRegexString}$`)
export const FunctionDeclarationRegex = new RegExp(`^${FunctionDeclarationRegexString}$`)
export const FunctionExpressionRegex = new RegExp(`^${FunctionExpressionRegexString}$`)
export const ClassExpressionRegex = new RegExp(`^${ClassExpressionRegexString}$`)
export const ConstructorDeclarationRegex = new RegExp(`^${ConstructorDeclarationRegexString}$`)
export const LangInternalSourceNodeRegExpRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)
export const ScopeRegex = new RegExp(`^${ScopeRegexString}$`)

// Source Node Identifier Regex
export const LangInternalSourceNodeIdentifierRegex = new RegExp(`^${LangInternalSourceNodeIdentifierRegexString}$`)
export const SourceNodeIdentifierPartRegex = new RegExp(`^${SourceNodeIdentifierPartRegexString}$`)
export const SourceNodeIdentifierRegex = new RegExp(`^${SourceNodeIdentifierRegexString}$`)
export const LangInternalPathRegex = new RegExp(`^${LangInternalPathRegexString}$`)