export const SourceNodeNameRegexString = '[a-zA-Z0-9_$#]+'
export const SourceNodeNameExpressionRegexString =
	`(?:${SourceNodeNameRegexString}|\\((?:literal|expression):${SourceNodeNameRegexString}\\)|\\(anonymous:[0-9]+\\))`

export const RootRegexString = '{(root)}'
export const ConstructorDeclarationRegexString = '{constructor:(constructor)}'
export const ClassDeclarationRegexString = `{class:(${SourceNodeNameRegexString})}`
export const MethodDefinitionRegexString = `{method(?:@static)?:(${SourceNodeNameExpressionRegexString})}`
export const FunctionDeclarationRegexString = `{function:(${SourceNodeNameExpressionRegexString})}`
export const FunctionExpressionRegexString = `{functionExpression(?:@static)?:(${SourceNodeNameExpressionRegexString})}`
export const ClassExpressionRegexString = `{classExpression:(${SourceNodeNameExpressionRegexString})}`
// Scopes
export const ExpressionHashRegexString = '[A-Za-z0-9]+'

export const ObjectLiteralExpressionRegexString = `{scope:\\(obj:(${SourceNodeNameExpressionRegexString})\\)}`
export const ModuleDeclarationRegexString =
// eslint-disable-next-line max-len
	`{scope:\\(namespace:(${SourceNodeNameExpressionRegexString}(?:.${SourceNodeNameExpressionRegexString})*):[0-9]+\\)}`
export const IfStatementRegexString = '{scope:(\\(if:[0-9]+\\))}'
export const IfThenStatementRegexString = '{scope:(\\(then\\))}'
export const IfElseStatementRegexString = '{scope:(\\(else\\))}'
// eslint-disable-next-line max-len
export const SwitchStatementRegexString = '{scope:(\\(switch:[0-9]+\\))}'
export const SwitchCaseClauseRegexString = `{scope:(\\(case:(?:${ExpressionHashRegexString}|default)\\))}`

// eslint-disable-next-line max-len
export const ScopeRegexString = `(?:${ObjectLiteralExpressionRegexString}|${ModuleDeclarationRegexString}|${IfStatementRegexString}|${IfThenStatementRegexString}|${IfElseStatementRegexString}|${SwitchStatementRegexString}|${SwitchCaseClauseRegexString})`

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
export const ConstructorDeclarationRegex = new RegExp(`^${ConstructorDeclarationRegexString}$`)
export const ClassDeclarationRegex = new RegExp(`^${ClassDeclarationRegexString}$`)
export const MethodDefinitionRegex = new RegExp(`^${MethodDefinitionRegexString}$`)
export const FunctionDeclarationRegex = new RegExp(`^${FunctionDeclarationRegexString}$`)
export const FunctionExpressionRegex = new RegExp(`^${FunctionExpressionRegexString}$`)
export const ClassExpressionRegex = new RegExp(`^${ClassExpressionRegexString}$`)
export const ObjectLiteralExpressionRegex = new RegExp(`^${ObjectLiteralExpressionRegexString}$`)
export const ModuleDeclarationRegex = new RegExp(`^${ModuleDeclarationRegexString}$`)
export const IfStatementRegex = new RegExp(`^${IfStatementRegexString}$`)
export const IfThenStatementRegex = new RegExp(`^${IfThenStatementRegexString}$`)
export const IfElseStatementRegex = new RegExp(`^${IfElseStatementRegexString}$`)
export const SwitchStatementRegex = new RegExp(`^${SwitchStatementRegexString}$`)
export const SwitchCaseClauseRegex = new RegExp(`^${SwitchCaseClauseRegexString}$`)
export const ScopeRegex = new RegExp(`^${ScopeRegexString}$`)

export const LangInternalSourceNodeRegExpRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)

// Source Node Identifier Regex
export const LangInternalSourceNodeIdentifierRegex = new RegExp(`^${LangInternalSourceNodeIdentifierRegexString}$`)
export const SourceNodeIdentifierPartRegex = new RegExp(`^${SourceNodeIdentifierPartRegexString}$`)
export const SourceNodeIdentifierRegex = new RegExp(`^${SourceNodeIdentifierRegexString}$`)
export const LangInternalPathRegex = new RegExp(`^${LangInternalPathRegexString}$`)