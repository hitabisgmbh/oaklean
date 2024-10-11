import type {
	ISourceFileMetaData,
	IAggregatedSourceNodeMetaData
} from './SourceFileMetaData'
import type { IGlobalIndex } from './index/GlobalIndex'
import type { INodeModule, NodeModuleIdentifier_string } from './NodeModule'

import type { LangInternalPath_string } from '../SourceNodeIdentifiers'
import type { UnifiedPath_string, UnifiedPathPart_string } from '../system/UnifiedPath'

export enum SourceFileMetaDataTreeType {
	Root = 'Root',
	File = 'File',
	Directory = 'Directory',
	Module = 'Module'
}

export type UnifiedPath_stringOnlyForPathNode<T> =
	T extends SourceFileMetaDataTreeType.File | SourceFileMetaDataTreeType.Directory ? UnifiedPath_string : undefined

export type IGlobalIndexOnlyForRootNode<T> = T extends SourceFileMetaDataTreeType.Root ? IGlobalIndex : undefined
export type IEngineModuleOnlyForRootNode<T> = T extends SourceFileMetaDataTreeType.Root ? INodeModule : undefined


export interface ISourceFileMetaDataTree<T extends SourceFileMetaDataTreeType> {
	aggregatedLangInternalSourceNodeMetaData?: IAggregatedSourceNodeMetaData
	aggregatedInternSourceMetaData?: IAggregatedSourceNodeMetaData
	aggregatedExternSourceMetaData?: IAggregatedSourceNodeMetaData
	type: T
	filePath: UnifiedPath_stringOnlyForPathNode<T>
	compiledSourceFilePath?: UnifiedPath_string,
	originalSourceFilePath?: UnifiedPath_string,
	langInternalChildren?: Record<
	LangInternalPath_string,
	ISourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>
	internChildren?: Record<
	UnifiedPathPart_string,
	ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Directory | SourceFileMetaDataTreeType.File>>
	externChildren?: Record<NodeModuleIdentifier_string, ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>
	sourceFileMetaData?: ISourceFileMetaData
	globalIndex: IGlobalIndexOnlyForRootNode<T>
	engineModule: IEngineModuleOnlyForRootNode<T>
}