import {
	UnifiedPathPart_string,
	ISourceFileMetaDataTree as old_ISourceFileMetaDataTree,
	IAggregatedSourceNodeMetaData as old_IAggregatedSourceNodeMetaData,
	IModuleReport as old_IModuleReport,
	NodeModuleIdentifier_string,
	UnifiedPath_string,
	NodeInternalPath_string,
	ISourceFileMetaData as old_ISourceFileMetaData,
	SourceNodeMetaDataType as old_SourceNodeMetaDataType,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	IProjectReport as old_IProjectReport,
	ISourceNodeMetaData as old_ISourceNodeMetaData
} from '../versionFormats/ProjectReportFormat-00001-0.0.9'
import {
	IAggregatedSourceNodeMetaData as new_IAggregatedSourceNodeMetaData,
	ISourceFileMetaDataTree as new_ISourceFileMetaDataTree,
	IModuleReport as new_IModuleReport,
	LangInternalPath_string,
	ISourceFileMetaData as new_ISourceFileMetaData,
	SourceNodeMetaDataType as new_SourceNodeMetaDataType,
	IProjectReport as new_IProjectReport,
	ISourceNodeMetaData as new_ISourceNodeMetaData
} from '../versionFormats/ProjectReportFormat-00002-0.0.10'

export class ProjectReportTransformer {
	static transform_SourceNodeMetaDataType(oldType: old_SourceNodeMetaDataType): new_SourceNodeMetaDataType {
		switch (oldType) {
			case old_SourceNodeMetaDataType.SourceNode:
				return new_SourceNodeMetaDataType.SourceNode
			case old_SourceNodeMetaDataType.NodeInternalSourceNode:
				return new_SourceNodeMetaDataType.LangInternalSourceNode
			case old_SourceNodeMetaDataType.NodeInternalSourceNodeReference:
				return new_SourceNodeMetaDataType.LangInternalSourceNodeReference
			case old_SourceNodeMetaDataType.InternSourceNodeReference:
				return new_SourceNodeMetaDataType.InternSourceNodeReference
			case old_SourceNodeMetaDataType.ExternSourceNodeReference:
				return new_SourceNodeMetaDataType.ExternSourceNodeReference
			case old_SourceNodeMetaDataType.Aggregate:
				return new_SourceNodeMetaDataType.Aggregate
		}
	}

	static transform_GlobalSourceNodeIdentifier_string_ISourceNodeMetaData_Record(
		oldRecord: Record<GlobalSourceNodeIdentifier_string, old_ISourceNodeMetaData> | undefined
	): Record<GlobalSourceNodeIdentifier_string, new_ISourceNodeMetaData> | undefined{
		if (!oldRecord) {
			return undefined
		}
		return Object.entries(oldRecord).reduce(
			(acc: Record<GlobalSourceNodeIdentifier_string, new_ISourceNodeMetaData>, [key, value]) => {
				acc[key as GlobalSourceNodeIdentifier_string]
					= ProjectReportTransformer.transform_ISourceNodeMetaData(value)
				return acc
			},
			{}
		)
	}

	static transform_ISourceNodeMetaData(oldSourceNodeMetaData: old_ISourceNodeMetaData): new_ISourceNodeMetaData {
		const lang_internal: Record<GlobalSourceNodeIdentifier_string, new_ISourceNodeMetaData> | undefined
			= ProjectReportTransformer.transform_GlobalSourceNodeIdentifier_string_ISourceNodeMetaData_Record(
				oldSourceNodeMetaData.node_internal
			)
		const intern: Record<GlobalSourceNodeIdentifier_string, new_ISourceNodeMetaData> | undefined
			= ProjectReportTransformer.transform_GlobalSourceNodeIdentifier_string_ISourceNodeMetaData_Record(
				oldSourceNodeMetaData.intern
			)
		const extern: Record<GlobalSourceNodeIdentifier_string, new_ISourceNodeMetaData> | undefined
			= ProjectReportTransformer.transform_GlobalSourceNodeIdentifier_string_ISourceNodeMetaData_Record(
				oldSourceNodeMetaData.extern
			)

		return {
			type: ProjectReportTransformer.transform_SourceNodeMetaDataType(oldSourceNodeMetaData.type),
			sensorValues: {
				profilerHits: oldSourceNodeMetaData.hits,
				langInternalCPUTime: oldSourceNodeMetaData.nodeInternalTime,
				internCPUTime: oldSourceNodeMetaData.internTime,
				externCPUTime: oldSourceNodeMetaData.externTime,
				aggregatedCPUTime: oldSourceNodeMetaData.aggregatedTime,
				selfCPUTime: oldSourceNodeMetaData.selfTime
			},
			lang_internal: lang_internal,
			intern: intern,
			extern: extern,
		}
	}

	static transform_SourceFileMetaData(oldSourceFileMetaData: old_ISourceFileMetaData): new_ISourceFileMetaData {
		let functions: Record<SourceNodeIdentifier_string, new_ISourceNodeMetaData> | undefined = {}

		if (!oldSourceFileMetaData.functions) {
			functions = undefined
		} else {
			functions = Object.entries(oldSourceFileMetaData.functions).reduce(
				(acc: Record<SourceNodeIdentifier_string, new_ISourceNodeMetaData>, [key, value]) => {
					acc[key as SourceNodeIdentifier_string]
						= ProjectReportTransformer.transform_ISourceNodeMetaData(value)
					return acc
				},
				{}
			)
		}

		return {
			path: oldSourceFileMetaData.path as (UnifiedPath_string | LangInternalPath_string),
			functions: functions
		}
	}

	static transform_langInternal(
		old_langInternal: Record<NodeInternalPath_string, old_ISourceFileMetaData> | undefined 
	): Record<LangInternalPath_string, new_ISourceFileMetaData> | undefined {
		if (!old_langInternal) {
			return undefined
		}
		return Object.entries(old_langInternal).reduce(
			(acc: Record<LangInternalPath_string, new_ISourceFileMetaData>, [key, value]) => {
				acc[key as LangInternalPath_string]
					= ProjectReportTransformer.transform_SourceFileMetaData(value)
				return acc
			},
			{}
		)
	}

	static transform_intern(
		old_intern: Record<UnifiedPath_string, old_ISourceFileMetaData> | undefined
	): Record<UnifiedPath_string, new_ISourceFileMetaData> | undefined {
		if (!old_intern) {
			return undefined
		}
		return Object.entries(old_intern).reduce(
			(acc: Record<UnifiedPath_string, new_ISourceFileMetaData>, [key, value]) => {
				acc[key as UnifiedPath_string]
					= ProjectReportTransformer.transform_SourceFileMetaData(value)
				return acc
			},
			{}
		)
	}

	static transform_extern(
		old_extern: Record<NodeModuleIdentifier_string, old_IModuleReport> | undefined
	) {
		if (!old_extern) {
			return undefined
		}
		return Object.entries(old_extern).reduce(
			(acc: Record<NodeModuleIdentifier_string, new_IModuleReport>, [key, value]) => {
				acc[key as NodeModuleIdentifier_string]
					= ProjectReportTransformer.transform_moduleReport(value)
				return acc
			},
			{}
		)
	}

	static transform_moduleReport(oldModuleReport: old_IModuleReport): new_IModuleReport {
		return {
			reportVersion: '0.0.10',
			relativeRootDir: oldModuleReport.relativeRootDir,
			nodeModule: oldModuleReport.nodeModule,
			internMapping: oldModuleReport.internMapping,
			lang_internal: ProjectReportTransformer.transform_langInternal(oldModuleReport.node_internal),
			intern: ProjectReportTransformer.transform_intern(oldModuleReport.intern),
			extern: ProjectReportTransformer.transform_extern(oldModuleReport.extern)
		}
	}

	static transform_projectReport(old_projectReport: old_IProjectReport): new_IProjectReport {
		return {
			reportVersion: '0.0.10',
			relativeRootDir: old_projectReport.relativeRootDir,
			projectMetaData: old_projectReport.projectMetaData,
			executionDetails: old_projectReport.executionDetails,
			internMapping: old_projectReport.internMapping,
			lang_internal: ProjectReportTransformer.transform_langInternal(old_projectReport.node_internal),
			intern: ProjectReportTransformer.transform_intern(old_projectReport.intern),
			extern: ProjectReportTransformer.transform_extern(old_projectReport.extern)
		}
	}

	static transform_IAggregatedSourceNodeMetaData(
		old_iAggregatedSourceNodeMetaData: old_IAggregatedSourceNodeMetaData | undefined
	): new_IAggregatedSourceNodeMetaData | undefined {
		if (!old_iAggregatedSourceNodeMetaData) {
			return undefined
		}
		return {
			total: ProjectReportTransformer.transform_ISourceNodeMetaData(old_iAggregatedSourceNodeMetaData.total),
			max: ProjectReportTransformer.transform_ISourceNodeMetaData(old_iAggregatedSourceNodeMetaData.max)
		}
	}

	static transform_sourceFileMetaDataTree(
		old_sourceFileMetaDataTree: old_ISourceFileMetaDataTree
	): new_ISourceFileMetaDataTree {
		let internChildren: Record<UnifiedPathPart_string, new_ISourceFileMetaDataTree> | undefined = undefined
		if (old_sourceFileMetaDataTree.internChildren) {
			internChildren = Object.entries(old_sourceFileMetaDataTree.internChildren).reduce(
				(acc: Record<UnifiedPathPart_string, new_ISourceFileMetaDataTree>, [key, value]) => {
					acc[key as UnifiedPathPart_string]
						= ProjectReportTransformer.transform_sourceFileMetaDataTree(value)
					return acc
				},
				{}
			)
		}

		let externChildren: Record<NodeModuleIdentifier_string, new_ISourceFileMetaDataTree> | undefined = undefined
		if (old_sourceFileMetaDataTree.externChildren) {
			externChildren = Object.entries(old_sourceFileMetaDataTree.externChildren).reduce(
				(acc: Record<NodeModuleIdentifier_string, new_ISourceFileMetaDataTree>, [key, value]) => {
					acc[key as NodeModuleIdentifier_string]
						= ProjectReportTransformer.transform_sourceFileMetaDataTree(value)
					return acc
				},
				{}
			)
		}

		return {
			aggregatedInternalSourceNodeMetaData:
				ProjectReportTransformer.transform_IAggregatedSourceNodeMetaData(
					old_sourceFileMetaDataTree.aggregatedInternalSourceNodeMetaData
				),
			aggregatedInternSourceMetaData:
				ProjectReportTransformer.transform_IAggregatedSourceNodeMetaData(
					old_sourceFileMetaDataTree.aggregatedInternSourceMetaData
				),
			aggregatedExternSourceMetaData:
				ProjectReportTransformer.transform_IAggregatedSourceNodeMetaData(
					old_sourceFileMetaDataTree.aggregatedExternSourceMetaData
				),
			type: old_sourceFileMetaDataTree.type,
			filePath: old_sourceFileMetaDataTree.filePath,
			originalSourceFilePath: old_sourceFileMetaDataTree.originalSourceFilePath,
			internChildren: internChildren,
			externChildren: externChildren,
			sourceFileMetaData: old_sourceFileMetaDataTree.sourceFileMetaData
				? ProjectReportTransformer.transform_SourceFileMetaData(old_sourceFileMetaDataTree.sourceFileMetaData)
				: undefined
		}
	}
}