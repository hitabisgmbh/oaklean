const GitHashSymbol: unique symbol = Symbol('GitHashSymbol')
export type GitHash_string = string & { [GitHashSymbol]: never }
