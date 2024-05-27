import { INodeModule, NodeModule } from './NodeModule'
import { Report, IReport, ReportType, ReportKind } from './Report'
import { GlobalIndex } from './index/GlobalIndex'
import { ModuleIndex } from './index/ModuleIndex'
export interface IModuleReport extends IReport {
	nodeModule: INodeModule
}

export class ModuleReport extends Report {
	nodeModule: NodeModule

	constructor(
		moduleIndex: ModuleIndex,
		nodeModule: NodeModule,
		kind: ReportKind
	) {
		super(moduleIndex, kind)
		this.nodeModule = nodeModule
	}

	static merge(
		moduleIndex: ModuleIndex,
		...args: ModuleReport[]
	): ModuleReport {
		if (args.length === 0) {
			throw new Error('ModuleReport.merge: no ModuleReports were given')
		}
		const nodeModule = args[0].nodeModule

		for (const moduleReport of args) {
			if (nodeModule.identifier !== moduleReport.nodeModule.identifier) {
				throw new Error('ModuleReport.merge: all ModuleReports should be from the same module.')
			}
		}
		
		const result = Object.assign(
			new ModuleReport(
				moduleIndex,
				NodeModule.fromJSON(nodeModule.toJSON()),
				ReportKind.accumulated
			),
			Report.merge(moduleIndex, ...args)
		)
		return result
	}

	toJSON(): IModuleReport {
		const projectReportJSON = super.toJSON()
		const result = {
			nodeModule: this.nodeModule.toJSON()
		}

		return Object.assign(result, projectReportJSON)
	}

	static fromJSON(
		json: string | IModuleReport,
		moduleIndex: ModuleIndex
	): ModuleReport {
		let data: IModuleReport
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = Object.assign(
			new ModuleReport(
				moduleIndex,
				NodeModule.fromJSON(data.nodeModule),
				data.kind
			),
			Report.fromJSONReport(data, moduleIndex)
		)

		return result
	}

	toBuffer(): Buffer {
		const nodeModuleBuffer = this.nodeModule.toBuffer()
		const reportBuffer = super.toBuffer(ReportType.ModuleReport)

		return Buffer.concat([nodeModuleBuffer, reportBuffer])
	} 

	static consumeFromBuffer(
		buffer: Buffer,
		moduleIndex: ModuleIndex
	): { instance: Report, type: ReportType, remainingBuffer: Buffer } {
		throw new Error('ModuleReport.consumeFromBuffer: use consumeFromBuffer_ModuleReport instead')
	}

	static consumeFromBuffer_ModuleReport(
		buffer: Buffer,
		globalIndex: GlobalIndex
	): { instance: ModuleReport, remainingBuffer: Buffer } {
		const { instance: nodeModule, remainingBuffer } = NodeModule.consumeFromBuffer(buffer)
		const moduleIndex = globalIndex.getModuleIndex('get', nodeModule.identifier)

		if (moduleIndex === undefined) {
			throw new Error('ModuleReport.consumeFromBuffer: could not resolve module index')
		}
		const {
			instance: report,
			remainingBuffer: newRemainingBuffer
		} = Report.consumeFromBufferReport(remainingBuffer, moduleIndex)

		const result = Object.assign(
			new ModuleReport(
				moduleIndex,
				nodeModule,
				report.kind
			),
			report
		)

		return {
			instance: result,
			remainingBuffer: newRemainingBuffer
		}
	}
}