const MilliSecondsSymbol: unique symbol = Symbol('MilliSecondsSymbol')
export type MilliSeconds_number = number & { [MilliSecondsSymbol]: never }

const MicroSecondsSymbol: unique symbol = Symbol('MicroSecondsSymbol')
export type MicroSeconds_number = number & { [MicroSecondsSymbol]: never }

const NanoSecondsSymbol: unique symbol = Symbol('NanoSecondsSymbol')
export type NanoSeconds_BigInt = bigint & { [NanoSecondsSymbol]: never }