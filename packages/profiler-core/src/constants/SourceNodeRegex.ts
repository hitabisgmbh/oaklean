export const SourceNodeNameRegexString = '[^@:(){}]+'
export const SourceNodeNameExpressionRegexString =
	`(?:${SourceNodeNameRegexString}|\\((?:literal|expression):${SourceNodeNameRegexString}\\)|\\(anonymous:[0-9]+\\))`

export const RootRegexString = '{(root)}'
export const ConstructorDeclarationRegexString = '{constructor:(constructor)}'
export const ClassDeclarationRegexString = `{class:(${SourceNodeNameRegexString})}`
export const MethodDefinitionRegexString =
	`{method(?:@static)?(?:@get|@set)?:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const GetAccessorDeclarationRegexString =
	`{get(?:@static)?:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const SetAccessorDeclarationRegexString =
	`{set(?:@static)?:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const FunctionDeclarationRegexString = `{function:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const FunctionExpressionRegexString =
	`{functionExpression(?:@static)?:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const ClassExpressionRegexString =
	`{classExpression(?:@static)?:(${SourceNodeNameExpressionRegexString}(?::[0-9]+)?)}`
export const ClassStaticBlockDeclarationRegexString = '{(static:[0-9]+)}'

// Scopes
export const ExpressionHashRegexString = '[A-Za-z0-9]+'

export const ObjectLiteralExpressionRegexString =
	`{scope:\\(obj(?:@static)?:(${SourceNodeNameExpressionRegexString})\\)}`
export const ModuleDeclarationRegexString =
// eslint-disable-next-line max-len
	`{scope:\\(namespace:(${SourceNodeNameExpressionRegexString}(?:.${SourceNodeNameExpressionRegexString})*):[0-9]+\\)}`
export const IfStatementRegexString = '{scope:(\\(if:[0-9]+\\))}'
export const IfThenStatementRegexString = '{scope:(\\(then\\))}'
export const IfElseStatementRegexString = '{scope:(\\(else\\))}'
export const ForStatementRegexString = '{scope:(\\(for:[0-9]+\\))}'
export const WhileStatementRegexString = '{scope:(\\(while:[0-9]+\\))}'
export const TryStatementRegexString = '{scope:(\\(try:[0-9]+\\))}'
export const TryBlockStatementRegexString = '{scope:(\\(try\\))}'
export const CatchClauseStatementRegexString = '{scope:(\\(catch\\))}'
export const FinallyBlockStatementRegexString = '{scope:(\\(finally\\))}'
export const BlockStatementRegexString = '{scope:(\\(block:[0-9]+\\))}'
// eslint-disable-next-line max-len
export const SwitchStatementRegexString = '{scope:(\\(switch:[0-9]+\\))}'
export const SwitchCaseClauseRegexString = `{scope:(\\(case:(?:${ExpressionHashRegexString}|default)\\))}`

// eslint-disable-next-line max-len
export const ScopeRegexString = `(?:${ObjectLiteralExpressionRegexString}|${ModuleDeclarationRegexString}|${IfStatementRegexString}|${IfThenStatementRegexString}|${IfElseStatementRegexString}|${ForStatementRegexString}|${WhileStatementRegexString}|${SwitchStatementRegexString}|${SwitchCaseClauseRegexString}|${TryStatementRegexString}|${TryBlockStatementRegexString}|${CatchClauseStatementRegexString}|${FinallyBlockStatementRegexString}|${BlockStatementRegexString})`

export const LangInternalSourceNodeRegExpRegexString = 'RegExp: .*'
export const LangInternalSourceNodeNameRegexString = '[^{}]+'
export const LangInternalSourceNodeIdentifierRegexString =
	'(?:' +
	`{(?:${LangInternalSourceNodeNameRegexString})}` +
	`(?:\\.{|${LangInternalSourceNodeNameRegexString}})*`
	+ `|${LangInternalSourceNodeRegExpRegexString})`

export const SourceNodeIdentifierPathRegexString = '[^{}]+'

// eslint-disable-next-line max-len
export const SourceNodeIdentifierPartRegexString = `(?:${ConstructorDeclarationRegexString}|${ClassDeclarationRegexString}|${MethodDefinitionRegexString}|${GetAccessorDeclarationRegexString}|${SetAccessorDeclarationRegexString}|${FunctionDeclarationRegexString}|${FunctionExpressionRegexString}|${ClassExpressionRegexString}|${ClassStaticBlockDeclarationRegexString}|${ScopeRegexString})`

export const SourceNodeIdentifierRegexString =
	`(?:${RootRegexString}(?:\\.${SourceNodeIdentifierPartRegexString})*` +
	`|${LangInternalSourceNodeIdentifierRegexString})`
export const LangInternalPathRegexString = 'node:(?:[^\\/{}]*)(?:\\/[^\\/{}]*)*'

// Source Node Identifier-Part Regex
export const RootRegex = new RegExp(`^${RootRegexString}$`)
export const ConstructorDeclarationRegex = new RegExp(`^${ConstructorDeclarationRegexString}$`)
export const ClassDeclarationRegex = new RegExp(`^${ClassDeclarationRegexString}$`)
export const MethodDefinitionRegex = new RegExp(`^${MethodDefinitionRegexString}$`)
export const GetAccessorDeclarationRegex = new RegExp(`^${GetAccessorDeclarationRegexString}$`)
export const SetAccessorDeclarationRegex = new RegExp(`^${SetAccessorDeclarationRegexString}$`)
export const FunctionDeclarationRegex = new RegExp(`^${FunctionDeclarationRegexString}$`)
export const FunctionExpressionRegex = new RegExp(`^${FunctionExpressionRegexString}$`)
export const ClassExpressionRegex = new RegExp(`^${ClassExpressionRegexString}$`)
export const ObjectLiteralExpressionRegex = new RegExp(`^${ObjectLiteralExpressionRegexString}$`)
export const ModuleDeclarationRegex = new RegExp(`^${ModuleDeclarationRegexString}$`)
export const IfStatementRegex = new RegExp(`^${IfStatementRegexString}$`)
export const IfThenStatementRegex = new RegExp(`^${IfThenStatementRegexString}$`)
export const IfElseStatementRegex = new RegExp(`^${IfElseStatementRegexString}$`)
export const ForStatementRegex = new RegExp(`^${ForStatementRegexString}$`)
export const WhileStatementRegex = new RegExp(`^${WhileStatementRegexString}$`)
export const TryStatementRegex = new RegExp(`^${TryStatementRegexString}$`)
export const TryBlockStatementRegex = new RegExp(`^${TryBlockStatementRegexString}$`)
export const CatchClauseStatementRegex = new RegExp(`^${CatchClauseStatementRegexString}$`)
export const FinallyBlockStatementRegex = new RegExp(`^${FinallyBlockStatementRegexString}$`)
export const BlockStatementRegex = new RegExp(`^${BlockStatementRegexString}$`)
export const ClassStaticBlockDeclarationRegex = new RegExp(`^${ClassStaticBlockDeclarationRegexString}$`)
export const SwitchStatementRegex = new RegExp(`^${SwitchStatementRegexString}$`)
export const SwitchCaseClauseRegex = new RegExp(`^${SwitchCaseClauseRegexString}$`)
export const ScopeRegex = new RegExp(`^${ScopeRegexString}$`)

export const LangInternalSourceNodeRegExpRegex = new RegExp(`^${LangInternalSourceNodeRegExpRegexString}$`)

// Source Node Identifier Regex
export const LangInternalSourceNodeIdentifierRegex = new RegExp(`^${LangInternalSourceNodeIdentifierRegexString}$`)
export const SourceNodeIdentifierPartRegex = new RegExp(`^${SourceNodeIdentifierPartRegexString}$`)
export const SourceNodeIdentifierRegex = new RegExp(`^${SourceNodeIdentifierRegexString}$`)
export const LangInternalPathRegex = new RegExp(`^${LangInternalPathRegexString}$`)