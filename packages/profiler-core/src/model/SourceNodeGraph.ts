import { ModuleReport } from './ModuleReport'
import { ProjectReport } from './ProjectReport'
import { SourceNodeMetaData } from './SourceNodeMetaData'
import { ModelMap } from './ModelMap'

import {
	SourceNodeID_number,
	SourceNodeMetaDataType_Node,
	SourceNodeMetaDataType_Reference
} from '../types'

type ReportID = number
type SourceNodeID_string = `${ReportID}:${SourceNodeID_number}`
type ReferenceMap = ModelMap<
	SourceNodeID_string,
	ModelMap<SourceNodeID_string, SourceNodeMetaData<SourceNodeMetaDataType_Reference>>
>

export class SourceNodeGraph {
	private sourceNodes: ModelMap<
		SourceNodeID_string,
		SourceNodeMetaData<SourceNodeMetaDataType_Node>
	>
	private outgoingEdges: ReferenceMap
	private incomingEdges: ReferenceMap

	constructor() {
		this.sourceNodes = new ModelMap('string')
		this.outgoingEdges = new ModelMap('string')
		this.incomingEdges = new ModelMap('string')
	}

	addReferenceEdge(
		fromReport: ProjectReport | ModuleReport,
		fromSourceNode: SourceNodeMetaData<SourceNodeMetaDataType_Node>,
		toReport: ProjectReport | ModuleReport,
		toSourceNode: SourceNodeMetaData<SourceNodeMetaDataType_Node>,
		reference: SourceNodeMetaData<SourceNodeMetaDataType_Reference>
	) {
		// Create unique IDs for the source nodes
		const fromSourceNodeID: SourceNodeID_string = `${fromReport.internID}:${fromSourceNode.id}`
		const toSourceNodeID: SourceNodeID_string = `${toReport.internID}:${toSourceNode.id}`
		// Ensure both source nodes are in the graph
		this.sourceNodes.set(fromSourceNodeID, fromSourceNode)
		this.sourceNodes.set(toSourceNodeID, toSourceNode)

		// Get or create the outgoing and incoming edges maps
		let outgoingReferences = this.outgoingEdges.get(fromSourceNodeID)
		if (outgoingReferences === undefined) {
			outgoingReferences = new ModelMap('string')
			this.outgoingEdges.set(fromSourceNodeID, outgoingReferences)
		}
		let incomingReferences = this.incomingEdges.get(toSourceNodeID)
		if (incomingReferences === undefined) {
			incomingReferences = new ModelMap('string')
			this.incomingEdges.set(toSourceNodeID, incomingReferences)
		}

		// Add the reference in both directions
		outgoingReferences.set(toSourceNodeID, reference)
		incomingReferences.set(fromSourceNodeID, reference)
	}

	private insertSourceNode(
		projectReport: ProjectReport,
		report: ProjectReport | ModuleReport,
		sourceNodeMetaData: SourceNodeMetaData<SourceNodeMetaDataType_Node>
	) {
		this.sourceNodes.set(
			`${report.internID}:${sourceNodeMetaData.id}`,
			sourceNodeMetaData
		)
		for (const sourceNodeReference of sourceNodeMetaData.lang_internal.values()) {
			const target = projectReport.resolveSourceNodeID(
				sourceNodeReference.id,
				report
			)
			if (target.error === true) {
				console.log(target)
				console.log(
					JSON.stringify(
						projectReport.globalIndex.getSourceNodeIndexByID(sourceNodeReference.id)?.pathIndex.moduleIndex
						, null, 2)
				)
				throw new Error(
					'SourceNodeGraph.insertSourceNode: cannot resolve target source node for reference id: ' +
						sourceNodeReference.id.toString()
				)
			}

			this.addReferenceEdge(
				report,
				sourceNodeMetaData,
				target.report,
				target.sourceNode,
				sourceNodeReference
			)
		}
	}

	static fromProjectReport(
		projectReport: ProjectReport
	): SourceNodeGraph {
		return SourceNodeGraph.fromReport(projectReport, projectReport)
	}

	static fromReport(
		projectReport: ProjectReport,
		report: ProjectReport | ModuleReport,
		graph?: SourceNodeGraph
	): SourceNodeGraph {
		const graphToInsert = graph || new SourceNodeGraph()

		for (const sourceFileMetaData of report.lang_internal.values()) {
			for (const sourceNodeMetaData of sourceFileMetaData.functions.values()) {
				graphToInsert.insertSourceNode(
					projectReport,
					report,
					sourceNodeMetaData
				)
			}
		}
		for (const sourceFileMetaData of report.intern.values()) {
			for (const sourceNodeMetaData of sourceFileMetaData.functions.values()) {
				graphToInsert.insertSourceNode(
					projectReport,
					report,
					sourceNodeMetaData
				)
			}
		}

		for (const externModuleReport of report.extern.values()) {
			SourceNodeGraph.fromReport(
				projectReport,
				externModuleReport,
				graphToInsert
			)
		}
		return graphToInsert
	}

	toJSON() {
		return {
			sourceNodes: this.sourceNodes.toJSON(),
			outgoingEdges: this.outgoingEdges.toJSON(),
			incomingEdges: this.incomingEdges.toJSON()
		}
	}
}
