import {
	SourceNodeIdentifierPart_string
} from '../SourceNodeIdentifiers'

export enum IdentifierType {
	Name = 'Name',
	Expression = 'Expression',
	Literal = 'Literal',
	Anonymous = 'Anonymous',
	KeyWord = 'Keyword',
	IfStatement = 'IfStatement',
	ThenStatement = 'ThenStatement',
	ElseStatement = 'ElseStatement',
	SwitchStatement = 'SwitchStatement',
	SwitchCase = 'SwitchCase',
}

export enum ProgramStructureTreeType {
	Root = 'Root',
	ConstructorDeclaration = 'ConstructorDeclaration',
	ClassDeclaration = 'ClassDeclaration',
	ClassExpression = 'ClassExpression',
	MethodDefinition = 'MethodDefinition',
	FunctionDeclaration = 'FunctionDeclaration',
	FunctionExpression = 'FunctionExpression',
	ArrowFunctionExpression = 'ArrowFunctionExpression',
	Scope = 'Scope'
}

export type PSTIdentifierHierarchy = {
	type: ProgramStructureTreeType,
	children?: Record<SourceNodeIdentifierPart_string, PSTIdentifierHierarchy>
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