const MilliJouleSymbol: unique symbol = Symbol('MilliJouleSymbol')
export type MilliJoule_number = number & { [MilliJouleSymbol]: never }