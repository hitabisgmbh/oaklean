const ScriptIDSymbol: unique symbol = Symbol('ScriptIDSymbol')
export type ScriptID_string = string & { [ScriptIDSymbol]: never }
