export const UUIDSymbol: unique symbol = Symbol('IUUIDSymbol')
export type UUID_string = string & { [UUIDSymbol]: never }