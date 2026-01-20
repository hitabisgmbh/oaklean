import { ProjectReport } from '../../model/ProjectReport'
import { ModuleReport } from '../../model/ModuleReport'
import { SourceNodeMetaData } from '../../model/SourceNodeMetaData'
import { SourceNodeMetaDataType } from '../../types'

export class CallIdentifier {
	isAwaiterSourceNode: boolean

	readonly report: ProjectReport | ModuleReport
	readonly sourceNode: SourceNodeMetaData<
		SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode
	> | null
	readonly sourceNodeIDString: string
	readonly compensationLayerDepth: number

	constructor(
		report: ProjectReport | ModuleReport,
		sourceNode: SourceNodeMetaData<
			SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode
		> | null,
		compensationLayerDepth: number
	) {
		this.report = report
		this.sourceNode = sourceNode
		this.sourceNodeIDString = `${report.internID}:${sourceNode === null ? 'root' : sourceNode?.id}`
		this.isAwaiterSourceNode = false
		this.compensationLayerDepth = compensationLayerDepth
	}

	toString() {
		return this.sourceNodeIDString
	}

	toCompensationLayerString() {
		return `${this.compensationLayerDepth}:${this.sourceNodeIDString}`
	}
}
