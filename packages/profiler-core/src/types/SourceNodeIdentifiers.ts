const LangInternalSourceNodeIdentifierSymbol: unique symbol = Symbol('LangInternalSourceNodeIdentifierSymbol')
export type LangInternalSourceNodeIdentifier_string = string & { [LangInternalSourceNodeIdentifierSymbol]: never }

const LangInternalPathSymbol: unique symbol = Symbol('LangInternalPathSymbol')
export type LangInternalPath_string = string & { [LangInternalPathSymbol]: never }

const SourceNodeIdentifierSymbol: unique symbol = Symbol('SourceNodeIdentifierSymbol')
export type SourceNodeIdentifier_string =
	string & { [SourceNodeIdentifierSymbol]: never } | LangInternalSourceNodeIdentifier_string

export const SourceNodeIdentifierPartSymbol: unique symbol = Symbol('SourceNodeIdentifierPartSymbol')
export type SourceNodeIdentifierPart_string = string & { [SourceNodeIdentifierPartSymbol]: never }

const GlobalSourceNodeIdentifierSymbol: unique symbol = Symbol('GlobalSourceNodeIdentifierSymbol')
export type GlobalSourceNodeIdentifier_string = string & { [GlobalSourceNodeIdentifierSymbol]: never }