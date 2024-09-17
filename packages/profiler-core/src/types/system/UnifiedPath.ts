
const UnifiedPathSymbol: unique symbol = Symbol('UnifiedPathSymbol')
export type UnifiedPath_string = string & { [UnifiedPathSymbol]: never }

export const UnifiedPathPartSymbol: unique symbol = Symbol('UnifiedPathPartSymbol')
export type UnifiedPathPart_string = string & { [UnifiedPathPartSymbol]: never }