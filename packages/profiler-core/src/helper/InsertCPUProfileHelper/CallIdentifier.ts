import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import {
	SourceNodeMetaData
} from '../../model/SourceNodeMetaData'
import {
	SourceNodeMetaDataType
} from '../../types'

export class CallIdentifier {
	firstTimeVisited: boolean

	readonly report: ProjectReport | ModuleReport
	readonly sourceNode: SourceNodeMetaData<
	SourceNodeMetaDataType.SourceNode |
	SourceNodeMetaDataType.LangInternalSourceNode
	> | null
	readonly sourceNodeIDString: string

	constructor(
		report: ProjectReport | ModuleReport,
		sourceNode: SourceNodeMetaData<
		SourceNodeMetaDataType.SourceNode |
		SourceNodeMetaDataType.LangInternalSourceNode
		> | null,
		firstTimeVisited = false
	) {
		this.report = report
		this.sourceNode = sourceNode
		this.sourceNodeIDString = `${report.internID}:${sourceNode?.id}`
		this.firstTimeVisited = firstTimeVisited
	}

	toString() {
		return this.sourceNodeIDString
	}
}