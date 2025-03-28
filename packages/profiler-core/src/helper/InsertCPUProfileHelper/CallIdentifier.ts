import {
	SourceNodeID_number
} from '../../types'

export class CallIdentifier {
	readonly reportID: number
	readonly sourceNodeID: SourceNodeID_number
	readonly sourceNodeIDString: string

	constructor(reportID: number, sourceNodeID: SourceNodeID_number) {
		this.reportID = reportID
		this.sourceNodeID = sourceNodeID
		this.sourceNodeIDString = `${reportID}:${sourceNodeID}`
	}

	toString() {
		return this.sourceNodeIDString
	}
}