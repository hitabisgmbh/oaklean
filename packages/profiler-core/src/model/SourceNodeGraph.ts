import { ModuleReport } from './ModuleReport'
import { ProjectReport } from './ProjectReport'
import { SourceNodeMetaData } from './SourceNodeMetaData'
import { ModelMap } from './ModelMap'
import { ModelSet } from './ModelSet'
import { GlobalIndex } from './indices/GlobalIndex'

import {
	SourceNodeID_number,
	SourceNodeMetaDataType,
	SourceNodeMetaDataType_Node,
	SourceNodeMetaDataType_Reference
} from '../types'

type ReportID = number
type SourceNodeID_string = `${ReportID}:${SourceNodeID_number}`
type ReferenceMap = ModelMap<
	SourceNodeID_string,
	ModelMap<
		SourceNodeID_string,
		SourceNodeMetaData<SourceNodeMetaDataType_Reference>
	>
>

export class SourceNodeGraph {
	private _sourceNodes: ModelMap<
		SourceNodeID_string,
		SourceNodeMetaData<SourceNodeMetaDataType_Node>
	>
	private _outgoingSum: ModelMap<
		SourceNodeID_string,
		SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
	>
	private _incomingSum: ModelMap<
		SourceNodeID_string,
		SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
	>
	private _outgoingEdges: ReferenceMap
	private _incomingEdges: ReferenceMap

	private _reachabilityCache: ModelMap<
		SourceNodeID_string,
		ModelSet<SourceNodeID_string>
	>

	constructor() {
		this._sourceNodes = new ModelMap('string')
		this._outgoingSum = new ModelMap('string')
		this._incomingSum = new ModelMap('string')
		this._outgoingEdges = new ModelMap('string')
		this._incomingEdges = new ModelMap('string')
		this._reachabilityCache = new ModelMap('string')
	}

	get sourceNodes() {
		return this._sourceNodes
	}

	get outgoingEdges() {
		return this._outgoingEdges
	}
	
	get incomingEdges() {
		return this._incomingEdges
	}

	outgoingSumOfNode(nodeID: SourceNodeID_string) {
		let result = this._outgoingSum.get(nodeID)
		if (result === undefined) {
			const incomingEdges = this._outgoingEdges.get(nodeID)
			if (incomingEdges === undefined) {
				return undefined
			}
			result = SourceNodeMetaData.sum(
				...incomingEdges.values()
			)
			this._outgoingSum.set(nodeID, result)
		}
		return result
	}

	incomingSumOfNode(nodeID: SourceNodeID_string) {
		let result = this._incomingSum.get(nodeID)
		if (result === undefined) {
			const incomingEdges = this._incomingEdges.get(nodeID)
			if (incomingEdges === undefined) {
				return undefined
			}
			result = SourceNodeMetaData.sum(
				...incomingEdges.values()
			)
			this._incomingSum.set(nodeID, result)
		}
		return result
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
		let outgoingReferences = this._outgoingEdges.get(fromSourceNodeID)
		if (outgoingReferences === undefined) {
			outgoingReferences = new ModelMap('string')
			this._outgoingEdges.set(fromSourceNodeID, outgoingReferences)
		}
		let incomingReferences = this._incomingEdges.get(toSourceNodeID)
		if (incomingReferences === undefined) {
			incomingReferences = new ModelMap('string')
			this._incomingEdges.set(toSourceNodeID, incomingReferences)
		}

		// Add the reference in both directions
		outgoingReferences.set(toSourceNodeID, reference)
		incomingReferences.set(fromSourceNodeID, reference)
	}

	private insertSourceNode(
		report: ProjectReport | ModuleReport,
		globalIndex: GlobalIndex,
		sourceNodeMetaData: SourceNodeMetaData<SourceNodeMetaDataType_Node>
	) {
		this.sourceNodes.set(
			`${report.internID}:${sourceNodeMetaData.id}`,
			sourceNodeMetaData
		)
		for (const iterator of [
			sourceNodeMetaData.lang_internal,
			sourceNodeMetaData.intern,
			sourceNodeMetaData.extern
		]) {
			for (const sourceNodeReference of iterator.values()) {
				const source = report.resolveSourceNodeID(
					globalIndex,
					sourceNodeReference.id
				)
				if (source.error === true) {
					throw new Error(
						'SourceNodeGraph.insertSourceNode: cannot resolve source source node for reference id: ' +
							sourceNodeReference.id.toString()
					)
				}

				this.addReferenceEdge(
					source.report,
					source.sourceNode,
					report,
					sourceNodeMetaData,
					sourceNodeReference
				)
			}
		}
	}

	static fromProjectReport(projectReport: ProjectReport): SourceNodeGraph {
		return SourceNodeGraph.fromReport(projectReport, projectReport.globalIndex)
	}

	static fromReport(
		report: ProjectReport | ModuleReport,
		globalIndex: GlobalIndex,
		graph?: SourceNodeGraph
	): SourceNodeGraph {
		const graphToInsert = graph || new SourceNodeGraph()

		for (const sourceFileMetaData of report.lang_internal.values()) {
			for (const sourceNodeMetaData of sourceFileMetaData.functions.values()) {
				graphToInsert.insertSourceNode(
					report,
					globalIndex,
					sourceNodeMetaData
				)
			}
		}
		for (const sourceFileMetaData of report.intern.values()) {
			for (const sourceNodeMetaData of sourceFileMetaData.functions.values()) {
				graphToInsert.insertSourceNode(
					report,
					globalIndex,
					sourceNodeMetaData
				)
			}
		}

		for (const externModuleReport of report.extern.values()) {
			SourceNodeGraph.fromReport(
				externModuleReport,
				globalIndex,
				graphToInsert
			)
		}
		return graphToInsert
	}

	toJSON() {
		return {
			sourceNodes: this._sourceNodes.toJSON(),
			outgoingEdges: this._outgoingEdges.toJSON(),
			incomingEdges: this._incomingEdges.toJSON()
		}
	}

	reachabilityForNode(
		nodeID: SourceNodeID_string
	): ModelSet<SourceNodeID_string> {
		const cached = this._reachabilityCache.get(nodeID)
		if (cached === undefined) {
			const visited = new ModelSet<SourceNodeID_string>()
			this.dfs(nodeID, visited, this._reachabilityCache)
			this._reachabilityCache.set(nodeID, visited)
			return visited
		}
		return cached
	}

	dfs(
		sourceNodeID: SourceNodeID_string,
		visited: ModelSet<SourceNodeID_string>,
		reach?: ModelMap<SourceNodeID_string, ModelSet<SourceNodeID_string>>
	) {
		if (reach !== undefined) {
			const existing = reach.get(sourceNodeID)
			if (existing !== undefined) {
				existing.forEach((nodeID) => {
					visited.add(nodeID)
				})
				return
			}
		}
		const neighbors = this._outgoingEdges.get(sourceNodeID)
		if (neighbors === undefined) {
			return
		}
		for (const v of neighbors.keys()) {
			if (!visited.has(v)) {
				visited.add(v)
				this.dfs(v, visited, reach)
			}
		}
	}

	reachability() {
		if (this._reachabilityCache.size === this._sourceNodes.size) {
			return this._reachabilityCache
		}
		for (const nodeID of this._sourceNodes.keys()) {
			this.reachabilityForNode(nodeID)
		}
		return this._reachabilityCache
	}
}
