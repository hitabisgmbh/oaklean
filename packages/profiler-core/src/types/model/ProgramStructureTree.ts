import {
	SourceNodeIdentifierPart_string
} from '../SourceNodeIdentifiers'

export enum IdentifierType {
	Name = 'Name',
	Expression = 'Expression',
	Literal = 'Literal',
	Anonymous = 'Anonymous',
}

export enum ProgramStructureTreeType {
	Root = 'Root',
	ConstructorDeclaration = 'ConstructorDeclaration',
	ClassDeclaration = 'ClassDeclaration',
	MethodDefinition = 'MethodDefinition',
	FunctionDeclaration = 'FunctionDeclaration',
	FunctionExpression = 'FunctionExpression',
	ArrowFunctionExpression = 'ArrowFunctionExpression',
}

export type NodeLocation = {
	line: number,
	column: number,
}

export type NodeLocationRange = {
	beginLoc: NodeLocation,
	endLoc: NodeLocation
}

export interface IProgramStructureTree {
	id: number
	type: ProgramStructureTreeType
	identifierType: IdentifierType
	identifier: SourceNodeIdentifierPart_string
	beginLoc: NodeLocation
	endLoc: NodeLocation
	children: Record<SourceNodeIdentifierPart_string, IProgramStructureTree>
}