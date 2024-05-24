const UnifiedPathSymbol: unique symbol = Symbol('UnifiedPathSymbol')
export type UnifiedPath_string = string & { [UnifiedPathSymbol]: never }

const UnifiedPathPartSymbol: unique symbol = Symbol('UnifiedPathPartSymbol')
export type UnifiedPathPart_string = string & { [UnifiedPathPartSymbol]: never }

const NodeInternalPathSymbol: unique symbol = Symbol('NodeInternalPathSymbol')
export type NodeInternalPath_string = string & { [NodeInternalPathSymbol]: never }

const NodeModuleIdentifierSymbol: unique symbol = Symbol('NodeModuleIdentifierSymbol')
export type NodeModuleIdentifier_string = string & { [NodeModuleIdentifierSymbol]: never }

const NodeInternalSourceNodeIdentifierSymbol: unique symbol = Symbol('NodeInternalSourceNodeIdentifierSymbol')
export type NodeInternalSourceNodeIdentifier_string = string & { [NodeInternalSourceNodeIdentifierSymbol]: never }

const SourceNodeIdentifierSymbol: unique symbol = Symbol('SourceNodeIdentifierSymbol')
export type SourceNodeIdentifier_string =
	string & { [SourceNodeIdentifierSymbol]: never } | NodeInternalSourceNodeIdentifier_string

const GlobalSourceNodeIdentifierSymbol: unique symbol = Symbol('GlobalSourceNodeIdentifierSymbol')
export type GlobalSourceNodeIdentifier_string = string & { [GlobalSourceNodeIdentifierSymbol]: never }

const UUIDSymbol: unique symbol = Symbol('IUUIDSymbol')
export type UUID_string = string & { [UUIDSymbol]: never }

const ProjectIdentifierSymbol: unique symbol = Symbol('ProjectIdentifierSymbol')
export type ProjectIdentifier_string = UUID_string & { [ProjectIdentifierSymbol]: never }

const GitHashSymbol: unique symbol = Symbol('GitHashSymbol')
export type GitHash_string = string & { [GitHashSymbol]: never }

export interface IReport {
	reportVersion: string,
	relativeRootDir?: UnifiedPath_string
	internMapping?: Record<UnifiedPath_string, UnifiedPath_string>
	node_internal?: Record<NodeInternalPath_string, ISourceFileMetaData>
	intern?: Record<UnifiedPath_string, ISourceFileMetaData>
	extern?: Record<NodeModuleIdentifier_string, IModuleReport>
}

export interface INodeModule {
	name: string
	version: string
}

export interface IModuleReport extends IReport {
	nodeModule: INodeModule
}

export type CPUUsageOfSourceNode = {
	selfTime: number,
	aggregatedTime: number
}

export enum SourceNodeMetaDataType {
	SourceNode = 'SourceNode',
	NodeInternalSourceNode = 'NodeInternalSourceNode',
	NodeInternalSourceNodeReference = 'NodeInternalSourceNodeReference',
	InternSourceNodeReference = 'InternSourceNodeReference',
	ExternSourceNodeReference = 'ExternSourceNodeReference',
	Aggregate = 'Aggregate',
}

export interface ISourceNodeMetaData extends CPUUsageOfSourceNode {
	type: SourceNodeMetaDataType
	hits: number
	nodeInternalTime?: number,
	internTime?: number,
	externTime?: number,
	node_internal?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	intern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	extern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
}

export interface ISourceFileMetaData {
	path: UnifiedPath_string | NodeInternalPath_string,
	functions?: Record<SourceNodeIdentifier_string, ISourceNodeMetaData>
}
export type IProjectMetaData = {
	projectID: ProjectIdentifier_string
}

export type IProjectReportExecutionDetails = {
	commitHash: GitHash_string
	unstagedChanges: boolean
	timestamp: number
}

export interface IReport {
	reportVersion: string,
	relativeRootDir?: UnifiedPath_string
	internMapping?: Record<UnifiedPath_string, UnifiedPath_string>
	node_internal?: Record<NodeInternalPath_string, ISourceFileMetaData>
	intern?: Record<UnifiedPath_string, ISourceFileMetaData>
	extern?: Record<NodeModuleIdentifier_string, IModuleReport>
}

export interface IProjectReport extends IReport {
	projectMetaData: IProjectMetaData
	executionDetails: IProjectReportExecutionDetails
}

export enum SourceFileMetaDataTreeType {
	File = 'File',
	Directory = 'Directory',
	Module = 'Module',
}

export interface IAggregatedSourceNodeMetaData {
	total: ISourceNodeMetaData
	max: ISourceNodeMetaData
}

export interface ISourceFileMetaDataTree {
	aggregatedInternalSourceNodeMetaData?: IAggregatedSourceNodeMetaData
	aggregatedInternSourceMetaData?: IAggregatedSourceNodeMetaData
	aggregatedExternSourceMetaData?: IAggregatedSourceNodeMetaData
	type: SourceFileMetaDataTreeType
	filePath: UnifiedPath_string
	originalSourceFilePath?: UnifiedPath_string,
	internChildren?: Record<UnifiedPathPart_string, ISourceFileMetaDataTree>
	externChildren?: Record<NodeModuleIdentifier_string, ISourceFileMetaDataTree>
	sourceFileMetaData?: ISourceFileMetaData
}