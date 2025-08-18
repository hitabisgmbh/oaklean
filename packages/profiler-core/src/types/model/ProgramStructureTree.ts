import {
	SourceNodeIdentifierPart_string
} from '../SourceNodeIdentifiers'

export enum IdentifierType {
	Name = 'Name',
	Expression = 'Expression',
	Literal = 'Literal',
	Anonymous = 'Anonymous',
	KeyWord = 'Keyword',
	Statement = 'Statement',
	Hash = 'Hash',
}

export enum ProgramStructureTreeType {
	Root = 'Root',
	ConstructorDeclaration = 'ConstructorDeclaration',
	ClassDeclaration = 'ClassDeclaration',
	ClassExpression = 'ClassExpression',
	MethodDefinition = 'MethodDefinition',
	FunctionDeclaration = 'FunctionDeclaration',
	FunctionExpression = 'FunctionExpression',
	ObjectLiteralExpression = 'ObjectLiteralExpression',
	IfStatement = 'IfStatement',
	IfThenStatement = 'IfThenStatement',
	IfElseStatement = 'IfElseStatement',
	ForStatement = 'ForStatement',
	WhileStatement = 'WhileStatement',
	TryStatement = 'TryStatement',
	TryBlock = 'TryBlock',
	CatchClause = 'CatchClause',
	FinallyBlock = 'FinallyBlock',
	Block = 'Block',
	SwitchStatement = 'SwitchStatement',
	SwitchCaseClause = 'SwitchCaseClause',
	ModuleDeclaration = 'ModuleDeclaration',
}

export type ProgramStructureTreeTypeIntermediateScope = 
	ProgramStructureTreeType.IfThenStatement |
	ProgramStructureTreeType.IfElseStatement |
	ProgramStructureTreeType.SwitchCaseClause |
	ProgramStructureTreeType.TryBlock |
	ProgramStructureTreeType.CatchClause |
	ProgramStructureTreeType.FinallyBlock

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