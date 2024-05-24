export const SourceNodeNameRegexString = '[a-zA-Z0-9_$#]+'
export const SourceNodeNameExpressionRegex =
	`(?:${SourceNodeNameRegexString}|\\((?:literal|expression):${SourceNodeNameRegexString}\\))`

export const RootRegexString = '{root}'
export const RootRegex = new RegExp(RootRegexString)
export const ConstructorDeclarationRegex = '{constructor:constructor}'
export const ClassDeclarationRegex = `{class:${SourceNodeNameRegexString}}`
export const MethodDefinitionRegex = `{method:${SourceNodeNameExpressionRegex}}`
export const FunctionDeclarationRegex = `{function:${SourceNodeNameExpressionRegex}}`
export const FunctionExpressionRegex =
	`{functionExpression:(?:${SourceNodeNameExpressionRegex}|\\(anonymous:[0-9]+\\))}`

export const LangInternalSourceNodeRegExpRegexString = 'RegExp: .*'
export const LangInternalSourceNodeNameRegexString = '[^{}]+'
export const LangInternalSourceNodeIdentifierRegexString =
	'(?:' +
	`{(?:${LangInternalSourceNodeNameRegexString})}` +
	`(?:\\.{|${LangInternalSourceNodeNameRegexString}})*`
	+ `|${LangInternalSourceNodeRegExpRegexString})`
export const LangInternalSourceNodeIdentifierRegex = new RegExp(LangInternalSourceNodeIdentifierRegexString)

// eslint-disable-next-line max-len
export const SourceNodeIdentifierPartRegexString = `(?:${ConstructorDeclarationRegex}|${ClassDeclarationRegex}|${MethodDefinitionRegex}|${FunctionDeclarationRegex}|${FunctionExpressionRegex})`

export const SourceNodeIdentifierPartRegex = new RegExp(SourceNodeIdentifierPartRegexString)

export const SourceNodeIdentifierRegexString =
	`(?:${RootRegexString}(?:\\.${SourceNodeIdentifierPartRegexString})*|${LangInternalSourceNodeIdentifierRegex})`
export const SourceNodeIdentifierRegex = new RegExp(SourceNodeIdentifierRegexString)

export const LangInternalPathRegexString = 'node:(?:[^\\/{}]*)(?:\\/[^\\/{}]*)*'
export const LangInternalPathRegex = new RegExp(`^${LangInternalPathRegexString}$`)