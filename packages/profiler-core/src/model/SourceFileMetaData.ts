import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import {
	SourceNodeMetaData
} from './SourceNodeMetaData'
import { SensorValues } from './SensorValues'
import { PathIndex } from './index/PathIndex'
import { GlobalIndex } from './index/GlobalIndex'
import { SourceNodeIndex } from './index/SourceNodeIndex'

import {
	SourceNodeIdentifierRegex,
	SourceNodeIdentifierRegexString,
	LangInternalSourceNodeIdentifierRegex,
	LangInternalSourceNodeIdentifierRegexString
} from '../constants/SourceNodeRegex'
import { BufferHelper } from '../helper/BufferHelper'
// Types
import {
	LangInternalPath_string,
	SourceNodeIdentifier_string,
	UnifiedPath_string,
	PathID_number,
	SourceNodeID_number,
	IndexRequestType,
	SourceNodeIndexType,
	SourceNodeMetaDataType,
	ISourceFileMetaData,
	IAggregatedSourceNodeMetaData,
	MicroSeconds_number
} from '../types'

export class AggregatedSourceNodeMetaData extends BaseModel {
	total: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
	max: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>

	constructor(
		total: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
		max: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
	) {
		super()
		this.total = total
		this.max = max
	}

	toBuffer(): Buffer {
		throw new Error('ModelMap.toBuffer: not yet implemented')
	}

	toJSON(): IAggregatedSourceNodeMetaData {
		return {
			total: this.total.toJSON(),
			max: this.max.toJSON()
		}
	}

	static join(
		...args: AggregatedSourceNodeMetaData[]
	): AggregatedSourceNodeMetaData {
		return new AggregatedSourceNodeMetaData(
			SourceNodeMetaData.sum(...args.map((x) => x.total)),
			SourceNodeMetaData.max(...args.map((x) => x.max))
		)
	}

	static fromJSON(
		json: string | IAggregatedSourceNodeMetaData
	): AggregatedSourceNodeMetaData {
		let data: IAggregatedSourceNodeMetaData
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		return new AggregatedSourceNodeMetaData(
			SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.Aggregate>(data.total, undefined),
			SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.Aggregate>(data.max, undefined)
		)
	}
}

export class SourceFileMetaData extends BaseModel {
	path: UnifiedPath_string | LangInternalPath_string
	private _functions?: ModelMap<
	SourceNodeID_number,
	SourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>>

	pathIndex: PathIndex

	constructor(
		path: UnifiedPath_string | LangInternalPath_string,
		pathIndex: PathIndex
	) {
		super()
		this.path = path
		this.pathIndex = pathIndex
	}

	public get containsUncommittedChanges(): boolean {
		if (this.pathIndex === undefined) {
			return false
		}
		return this.pathIndex.containsUncommittedChanges
	}

	public set containsUncommittedChanges(v: boolean) {
		if (this.pathIndex !== undefined) {
			this.pathIndex.containsUncommittedChanges = v
		}
	}

	normalize(newGlobalIndex: GlobalIndex) {
		const newPathIndex = this.pathIndex.insertToOtherIndex(newGlobalIndex)
		const newFunctions = new ModelMap<
		SourceNodeID_number,
		SourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>>('number')
		for (const sourceNodeID of Array.from(this.functions.keys()).sort()) {
			const sourceNodeMetaData = this.functions.get(sourceNodeID)!
			sourceNodeMetaData.normalize(newGlobalIndex)
			newFunctions.set(sourceNodeMetaData.id, sourceNodeMetaData)
		}
		this.pathIndex = newPathIndex
		this._functions = newFunctions
	}

	static merge(
		pathIndex: PathIndex,
		...args: SourceFileMetaData[]
	) {
		if (args.length === 0) {
			throw new Error('SourceFileMetaData.merge: no SourceFileMetaDatas were given')
		}

		const path = args[0].path
		const containsUncommittedChanges = args.map((x) => x.containsUncommittedChanges).reduce(
			(prevValue: boolean, currValue: boolean) => prevValue || currValue
		)

		const valuesToMerge: {
			functions: Record<SourceNodeIdentifier_string, SourceNodeMetaData<
			SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>[]>
		} = {
			functions: {}
		}

		for (const currentSourceFileMetaData of args) {
			if (path !== currentSourceFileMetaData.path) {
				throw new Error('SourceFileMetaData.merge: all SourceFileMetaDatas should be from the same file.')
			}
			for (const [sourceNodeID, sourceNodeMetaData] of currentSourceFileMetaData.functions) {
				const sourceNodeIndex = currentSourceFileMetaData.getSourceNodeIndexByID(sourceNodeID)
				
				if (sourceNodeIndex === undefined) {
					throw new Error('SourceFileMetaData.merge: could not resolve sourceNode from id')
				}
				const identifier = sourceNodeIndex.identifier as SourceNodeIdentifier_string

				if (!valuesToMerge.functions[identifier]) {
					valuesToMerge.functions[identifier] = []
				}
				valuesToMerge.functions[identifier].push(sourceNodeMetaData)
			}
		}

		const result = new SourceFileMetaData(path, pathIndex)
		for (const [identifier, sourceNodeMetaDatas] of Object.entries(valuesToMerge.functions)) {
			const sourceNodeIndex = result.getSourceNodeIndex('upsert', identifier as SourceNodeIdentifier_string)
			const sourceNodeID = sourceNodeIndex.id as SourceNodeID_number
			
			result.functions.set(
				sourceNodeID,
				SourceNodeMetaData.merge(
					sourceNodeID,
					sourceNodeIndex,
					...sourceNodeMetaDatas,
				)
			)
		}
		result.containsUncommittedChanges = containsUncommittedChanges
		return result
	}

	get functions(): ModelMap<
	SourceNodeID_number,
	SourceNodeMetaData<
	SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>> {
		if (!this._functions) {
			this._functions = new ModelMap<
			SourceNodeID_number,
			SourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>>('number')
		}
		return this._functions
	}

	getSourceNodeIndexByID(id: SourceNodeID_number) {
		return this.pathIndex.moduleIndex.globalIndex.getSourceNodeIndexByID(id)
	}

	getSourceNodeIndex<T extends IndexRequestType>(
		indexRequestType: T,
		sourceNodeIdentifier: SourceNodeIdentifier_string
	) {
		return this.
			pathIndex.getSourceNodeIndex<T>(indexRequestType, sourceNodeIdentifier)
	}

	removeFromIntern(filePath: UnifiedPath_string | UnifiedPath_string[]) {
		let filePaths: UnifiedPath_string[] = []
		if (typeof filePath === 'string') {
			filePaths = [filePath]
		} else {
			filePaths = filePath
		}

		for (const sourceNodeMetaData of this.functions.values()) {
			sourceNodeMetaData.removeFromIntern(filePaths)			
		}
	}

	validate() {
		for (const [sourceNodeID, sourceNodeMetaData] of this.functions.entries()) {
			const sourceNodeIndex = this.getSourceNodeIndexByID(sourceNodeID)

			if (sourceNodeIndex === undefined) {
				throw new Error('SourceFileMetaData.validate: could not resolve source node index')
			}

			const identifier = sourceNodeIndex?.identifier as SourceNodeIdentifier_string
			if (
				sourceNodeMetaData.type === SourceNodeMetaDataType.LangInternalSourceNode
			) {
				if (!LangInternalSourceNodeIdentifierRegex.test(identifier)) {
					throw new Error(
						'SourceFileMetaData.validate: invalid LangInternalSourceNodeIdentifier_string:'
						+ identifier + '\n' +
						LangInternalSourceNodeIdentifierRegexString
					)
				}
			} else {
				if (!SourceNodeIdentifierRegex.test(identifier)) {
					throw new Error(
						`SourceFileMetaData.validate: invalid sourceNodeIdentifier: ${identifier}\n` +
						SourceNodeIdentifierRegexString
					)
				}
			}

			sourceNodeMetaData.validate(
				this.path,
				identifier
			)
		}
	}

	toJSON(): ISourceFileMetaData {
		if (process.env.NODE_ENV === 'test') {
			this.validate()
		}
		return {
			path: this.path,
			functions: this.functions.toJSON()
		}
	}

	static fromJSON(
		json: string | ISourceFileMetaData,
		pathIndex: PathIndex
	): SourceFileMetaData {
		let data: ISourceFileMetaData
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}
		const result = new SourceFileMetaData(
			data.path,
			pathIndex
		)
		if (data.functions) {
			for (const [sourceNodeID_string, nodeMetaData] of Object.entries(data.functions)) {
				const sourceNodeID = parseInt(sourceNodeID_string) as SourceNodeID_number
				result.functions.set(
					sourceNodeID,
					SourceNodeMetaData.fromJSON(nodeMetaData, pathIndex.moduleIndex.globalIndex)
				)
			}
		}
		return result
	}

	createOrGetSourceNodeMetaData<
		T extends SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode
	>(
		identifier: SourceNodeIdentifier_string,
		type: T
	):
		SourceNodeMetaData<T> {
		const sourceNodeIndex = this.getSourceNodeIndex('upsert', identifier)
		const sourceNodeID = sourceNodeIndex.id as SourceNodeID_number
		
		let node = this.functions.get(sourceNodeID) as SourceNodeMetaData<T>
		if (!node) {
			node = new SourceNodeMetaData<T>(
				type,
				sourceNodeID as T extends SourceNodeMetaDataType.Aggregate ? undefined : SourceNodeID_number,
				new SensorValues({}),
				sourceNodeIndex as T extends SourceNodeMetaDataType.Aggregate ?
					undefined : SourceNodeIndex<SourceNodeIndexType.SourceNode>
			)
			this.functions.set(sourceNodeID, node)
		}
		return node
	}

	/**
	 * Calculates the total SourceNodeMetaData for the SourceFile
	 * 
	 * hits, selfTime, aggregatedTime, langInternalTime, externTime and internTime are added up
	 * 
	 * intern self references are removed
	 * 
	 * @returns number
	 */
	totalSourceNodeMetaData(): {
		sum: SourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
		intern: ModelMap<PathID_number, SensorValues>,
		extern: ModelMap<PathID_number, SensorValues>,
		langInternal: ModelMap<PathID_number, SensorValues>
	} {
		const listToSum: SourceNodeMetaData<
		SourceNodeMetaDataType.SourceNode |
		SourceNodeMetaDataType.LangInternalSourceNode
		>[] = []
		const intern = new ModelMap<PathID_number, SensorValues>('number')
		const extern = new ModelMap<PathID_number, SensorValues>('number')
		const langInternal = new ModelMap<PathID_number, SensorValues>('number')

		for (const sourceNodeMetaData of this.functions.values()) {
			listToSum.push(sourceNodeMetaData)
			for (const sourceNodeMetaDataReferences of [
				sourceNodeMetaData.lang_internal,
				sourceNodeMetaData.intern,
				sourceNodeMetaData.extern
			]) {
				for (const sourceNodeMetaDataReference of sourceNodeMetaDataReferences.values()) {
					const pathID = sourceNodeMetaDataReference.sourceNodeIndex.pathIndex.id

					if (pathID === undefined) {
						throw new Error('totalSourceNodeMetaData: expected pathID')
					}
					switch (sourceNodeMetaDataReferences) {
						case sourceNodeMetaData.lang_internal: {
							const sensorValuesOfFile = langInternal.get(pathID)
							langInternal.set(pathID, SensorValues.sum(
								sourceNodeMetaDataReference.sensorValues,
								...(sensorValuesOfFile ? [sensorValuesOfFile] : [])
							))
						} break
						case sourceNodeMetaData.intern: {
							const sensorValuesOfFile = intern.get(pathID)
							intern.set(pathID, SensorValues.sum(
								sourceNodeMetaDataReference.sensorValues,
								...(sensorValuesOfFile ? [sensorValuesOfFile] : [])
							))
						} break
						case sourceNodeMetaData.extern: {
							const sensorValuesOfFile = extern.get(pathID)
							extern.set(pathID, SensorValues.sum(
								sourceNodeMetaDataReference.sensorValues,
								...(sensorValuesOfFile ? [sensorValuesOfFile] : [])
							))
						} break
					}

				}
			}
		}

		if (this.pathIndex.id === undefined) {
			throw new Error('totalSourceNodeMetaData: expected pathIndex.id')
		}
		const selfReference = intern.get(this.pathIndex.id)

		const result = SourceNodeMetaData.sum(...listToSum)
		if (selfReference !== undefined) {
			// remove self references
			result.sensorValues.addToIntern(selfReference, -1)
			result.sensorValues.addToAggregated(selfReference, -1)
			// remove self references
			intern.delete(this.pathIndex.id)
		}


		return {
			sum: result,
			intern,
			extern,
			langInternal
		}
	}

	maxSourceNodeMetaData() {
		return SourceNodeMetaData.max(...this.functions.values())
	}

	toBuffer() {
		const id = this.pathIndex.id
		if (id === undefined) {
			throw new Error('SourceFileMetaData.toBuffer: expected id')
		}

		const buffers = [
			BufferHelper.UIntToBuffer(id),
			this.functions.toBuffer()
		]

		return Buffer.concat(buffers)
	}

	static consumeFromBuffer(
		buffer: Buffer,
		globalIndex: GlobalIndex
	): { instance: SourceFileMetaData, remainingBuffer: Buffer } {
		let remainingBuffer = buffer
		const { instance: pathID, remainingBuffer: newRemainingBuffer1 } = BufferHelper.UIntFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1

		const pathIndex = globalIndex.getPathIndexByID(pathID as PathID_number)
		if (pathIndex === undefined) {
			throw new Error('SourceFileMetaData.consumeFromBuffer: could not resolve pathIndex')
		}
		const instance = new SourceFileMetaData(
			pathIndex.identifier,
			pathIndex
		)
		const consumeFromBufferWithModuleIndex = (buffer: Buffer) => {
			return SourceNodeMetaData.consumeFromBuffer<
			SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>(
				buffer,
				globalIndex
			)
		}

		const { instance: functions, remainingBuffer: newRemainingBuffer2 } = ModelMap.consumeFromBuffer<
		SourceNodeID_number,
		SourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>
		>(
			remainingBuffer,
			'number',
			consumeFromBufferWithModuleIndex
		)
		instance._functions = functions
		remainingBuffer = newRemainingBuffer2

		return {
			instance,
			remainingBuffer
		}
	}
}