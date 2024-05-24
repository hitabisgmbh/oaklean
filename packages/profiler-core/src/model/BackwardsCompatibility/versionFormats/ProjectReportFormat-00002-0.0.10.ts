import {
	SourceFileMetaDataTreeType,
	UnifiedPath_string,
	UnifiedPathPart_string,
	NodeModuleIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	ProjectIdentifier_string,
	GitHash_string
} from './ProjectReportFormat-00001-0.0.9'

const LangInternalPathSymbol: unique symbol = Symbol('LangInternalPathSymbol')
export type LangInternalPath_string = string & { [LangInternalPathSymbol]: never }

const LangInternalSourceNodeIdentifierSymbol: unique symbol = Symbol('LangInternalSourceNodeIdentifierSymbol')
export type LangInternalSourceNodeIdentifier_string = string & { [LangInternalSourceNodeIdentifierSymbol]: never }

const SourceNodeIdentifierSymbol: unique symbol = Symbol('SourceNodeIdentifierSymbol')
export type SourceNodeIdentifier_string =
	string & { [SourceNodeIdentifierSymbol]: never } | LangInternalSourceNodeIdentifier_string

export interface IReport {
	reportVersion: string,
	relativeRootDir?: UnifiedPath_string
	internMapping?: Record<UnifiedPath_string, UnifiedPath_string>
	lang_internal?: Record<LangInternalPath_string, ISourceFileMetaData>
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

export enum SourceNodeMetaDataType {
	SourceNode = 'SourceNode',
	LangInternalSourceNode = 'LangInternalSourceNode',
	LangInternalSourceNodeReference = 'LangInternalSourceNodeReference',
	InternSourceNodeReference = 'InternSourceNodeReference',
	ExternSourceNodeReference = 'ExternSourceNodeReference',
	Aggregate = 'Aggregate',
}

export interface IPureCPUTime {
	selfCPUTime?: number,
	aggregatedCPUTime?: number
}

export interface ISensorValues extends IPureCPUTime {
	profilerHits?: number
	internCPUTime?: number
	externCPUTime?: number
	langInternalCPUTime?: number
}

export interface ISourceNodeMetaData {
	type: SourceNodeMetaDataType
	sensorValues: ISensorValues
	lang_internal?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	intern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	extern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
}

export interface ISourceFileMetaData {
	path: UnifiedPath_string | LangInternalPath_string,
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
	lang_internal?: Record<LangInternalPath_string, ISourceFileMetaData>
	intern?: Record<UnifiedPath_string, ISourceFileMetaData>
	extern?: Record<NodeModuleIdentifier_string, IModuleReport>
}

export interface IProjectReport extends IReport {
	projectMetaData: IProjectMetaData
	executionDetails: IProjectReportExecutionDetails
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