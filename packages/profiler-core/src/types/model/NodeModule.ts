const NodeModuleIdentifierSymbol: unique symbol = Symbol(
	'NodeModuleIdentifierSymbol'
)
export type NodeModuleIdentifier_string = string & {
	[NodeModuleIdentifierSymbol]: never
}

export interface INodeModule {
	name: string
	version: string
}
