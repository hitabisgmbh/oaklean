import { BaseModel } from './BaseModel'
import { ModelMap } from './ModelMap'
import { SensorValues } from './SensorValues'
import { SourceNodeIndex } from './index/SourceNodeIndex'
import { GlobalIndex } from './index/GlobalIndex'
import { PathIndex } from './index/PathIndex'

import { GlobalIdentifier } from '../system/GlobalIdentifier'
import { BufferHelper } from '../helper/BufferHelper'
import { RootRegex, SourceNodeIdentifierPartRegex } from '../constants/SourceNodeRegex'
// Types
import {
	SourceNodeID_number,
	SourceNodeIndexType,
	IndexRequestType,
	SourceNodeMetaDataType,
	ISourceNodeMetaData,
	PathID_number,
	IPureCPUTime,
	IPureCPUEnergyConsumption,
	IPureRAMEnergyConsumption,
	MilliJoule_number,
	LangInternalPath_string,
	SourceNodeIdentifier_string,
	UnifiedPath_string,
	GlobalSourceNodeIdentifier_string,
	MicroSeconds_number
} from '../types'

export function validateSourceNodeIdentifier(identifier: SourceNodeIdentifier_string) {
	return (RootRegex.test(identifier) || SourceNodeIdentifierPartRegex.test(identifier))
}

function areNumbersClose(a: number, b: number, epsilon = 1e-10) {
	return Math.abs(a - b) < epsilon
}

type SourceNodeMetaDataTypeNotAggregate = Exclude<SourceNodeMetaDataType, SourceNodeMetaDataType.Aggregate>

type SourceNodeMetaDataTypeWithChildren =
SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode

type LangInternalMap<T> = T extends SourceNodeMetaDataTypeWithChildren ? ModelMap<
SourceNodeID_number,
SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
> : never

type InternMap<T> = T extends SourceNodeMetaDataTypeWithChildren ? ModelMap<
SourceNodeID_number,
SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
> : never

type ExternMap<T> = T extends SourceNodeMetaDataTypeWithChildren ? ModelMap<
SourceNodeID_number,
SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
> : never

export class SourceNodeMetaData<T extends SourceNodeMetaDataType> extends BaseModel {
	type: T
	sensorValues: SensorValues
	private _lang_internal?: LangInternalMap<T>
	private _intern?: InternMap<T>
	private _extern?: ExternMap<T>

	sourceNodeIndex: T extends SourceNodeMetaDataType.Aggregate ?
		undefined : SourceNodeIndex<SourceNodeIndexType.SourceNode>
	id: T extends SourceNodeMetaDataType.Aggregate ? undefined : SourceNodeID_number

	constructor(
		type: T,
		id: T extends SourceNodeMetaDataType.Aggregate ? undefined: SourceNodeID_number,
		sensorValues: SensorValues,
		sourceNodeIndex: T extends SourceNodeMetaDataType.Aggregate ?
			undefined : SourceNodeIndex<SourceNodeIndexType.SourceNode>
	) {
		super()
		this.type = type
		this.sensorValues = sensorValues
		this.sourceNodeIndex = sourceNodeIndex
		this.id = id
	}

	public get presentInOriginalSourceCode(): boolean {
		if (this.sourceNodeIndex === undefined) {
			return true
		}
		return this.sourceNodeIndex.presentInOriginalSourceCode
	}

	public set presentInOriginalSourceCode(v: boolean) {
		if (this.sourceNodeIndex !== undefined) {
			this.sourceNodeIndex.presentInOriginalSourceCode = v
		}
	}

	normalize(newGlobalIndex: GlobalIndex) {
		if (this.isAggregate()) {
			throw new Error('SourceNodeMetaData.normalize: can only be executed for non aggregate SourceNodeMetaData')
		}
		const self = this as
			SourceNodeMetaData<SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>
		const sourceNodeIndex = self.getSourceNodeIndexByID(self.id)
		if (sourceNodeIndex === undefined) {
			throw new Error('SourceNodeMetaData.normalize(self): could not resolve sourceNodeIndex for: ' + self.id.toString())
		}
		const newSourceNodeIndex = sourceNodeIndex.insertToOtherIndex(newGlobalIndex)
		if (SourceNodeMetaData.couldHaveChildren(self)) {
			// remap all child nodes
			const new_lang_internal = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
			SourceNodeMetaDataType.LangInternalSourceNodeReference
			>>('number')
			// remap all lang_internal nodes
			for (const sourceNodeID of Array.from(self.lang_internal.keys()).sort()) {
				const sourceNodeMetaData = self.lang_internal.get(sourceNodeID)!
				sourceNodeMetaData.normalize(newGlobalIndex)
				new_lang_internal.set(sourceNodeMetaData.id, sourceNodeMetaData)
			}
			const new_intern = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
			SourceNodeMetaDataType.InternSourceNodeReference
			>>('number')
			// remap all intern nodes
			for (const sourceNodeID of Array.from(self.intern.keys()).sort()) {
				const sourceNodeMetaData = self.intern.get(sourceNodeID)!
				sourceNodeMetaData.normalize(newGlobalIndex)
				new_intern.set(sourceNodeMetaData.id, sourceNodeMetaData)
			}
			const new_extern = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
			SourceNodeMetaDataType.ExternSourceNodeReference
			>>('number')
			// remap all extern nodes
			for (const sourceNodeID of Array.from(self.extern.keys()).sort()) {
				const sourceNodeMetaData = self.extern.get(sourceNodeID)!
				sourceNodeMetaData.normalize(newGlobalIndex)
				new_extern.set(sourceNodeMetaData.id, sourceNodeMetaData)
			}
			self._lang_internal = new_lang_internal
			self._intern = new_intern
			self._extern = new_extern	
		}
		// remap the self ID and the self moduleIndex
		self.id = newSourceNodeIndex.id
		self.sourceNodeIndex = newSourceNodeIndex
	}

	globalIdentifier(): T extends SourceNodeMetaDataTypeNotAggregate ? GlobalIdentifier : undefined {
		if (this.isNotAggregate()) {
			const index = this.getIndex()
			if (index !== undefined) {
				return index.globalIdentifier() as
					T extends SourceNodeMetaDataTypeNotAggregate ? GlobalIdentifier : undefined
			}
		}
		throw new Error('SourceNodeMetaData.globalIdentifier: cannot resolve globalIdentifier')
	}

	isAggregate(): this is SourceNodeMetaData<SourceNodeMetaDataType.Aggregate> {
		return this.type === SourceNodeMetaDataType.Aggregate
	}

	isNotAggregate(): this is SourceNodeMetaData<SourceNodeMetaDataTypeNotAggregate> {
		return this.type !== SourceNodeMetaDataType.Aggregate
	}

	getSourceNodeIndexByID(id: SourceNodeID_number) {
		return this.sourceNodeIndex?.pathIndex.moduleIndex.globalIndex.getSourceNodeIndexByID(id)
	}

	getPathIndexByID(id: PathID_number) {
		return this.sourceNodeIndex?.pathIndex.moduleIndex.globalIndex.getPathIndexByID(id)
	}

	getIndex(): SourceNodeIndex<SourceNodeIndexType.SourceNode> | undefined {
		if (this.isNotAggregate()) {
			return this.sourceNodeIndex
		}
	}

	getPathIndex<
		T extends IndexRequestType,
		R = T extends 'upsert' ? PathIndex : PathIndex | undefined
	>(
		indexRequestType: T,
		filePath: UnifiedPath_string
	): R {
		if (this.sourceNodeIndex === undefined) {
			throw new Error('SourceNodeMetaData.getPathIndex: sourceNodeIndex is not defined')
		}

		return this.sourceNodeIndex.pathIndex.moduleIndex.getFilePathIndex(indexRequestType, filePath)
	}

	// IMPORTANT to change when new measurement type gets added
	static merge<T extends Exclude<SourceNodeMetaDataType, SourceNodeMetaDataType.Aggregate>>(
		sourceNodeID: T extends SourceNodeMetaDataType.Aggregate ? undefined : SourceNodeID_number,
		sourceNodeIndex: SourceNodeIndex<SourceNodeIndexType.SourceNode>,
		...args: SourceNodeMetaData<T>[]
	): SourceNodeMetaData<T> {
		if (args.length === 0) {
			throw new Error('SourceNodeMetaData.merge: no SourceNodeMetaData were given')
		}
		const type = args[0].type
		const presentInOriginalSourceCode = args.map((x) => x.presentInOriginalSourceCode).reduce(
			(prevValue: boolean, currValue: boolean) => prevValue && currValue
		)

		const valuesToSum = {
			profilerHits: 0,

			selfCPUTime: 0 as MicroSeconds_number,
			aggregatedCPUTime: 0 as MicroSeconds_number,
			langInternalCPUTime: 0 as MicroSeconds_number,
			internCPUTime: 0 as MicroSeconds_number,
			externCPUTime: 0 as MicroSeconds_number,

			selfCPUEnergyConsumption: 0 as MilliJoule_number,
			aggregatedCPUEnergyConsumption: 0 as MilliJoule_number,
			internCPUEnergyConsumption: 0 as MilliJoule_number,
			externCPUEnergyConsumption: 0 as MilliJoule_number,
			langInternalCPUEnergyConsumption: 0 as MilliJoule_number,

			selfRAMEnergyConsumption: 0 as MilliJoule_number,
			aggregatedRAMEnergyConsumption: 0 as MilliJoule_number,
			internRAMEnergyConsumption: 0 as MilliJoule_number,
			externRAMEnergyConsumption: 0 as MilliJoule_number,
			langInternalRAMEnergyConsumption: 0 as MilliJoule_number,
		}

		const valuesToMerge: {
			lang_internal: Record<GlobalSourceNodeIdentifier_string, SourceNodeMetaData<
			SourceNodeMetaDataType.LangInternalSourceNodeReference
			>[]>,
			intern: Record<GlobalSourceNodeIdentifier_string, SourceNodeMetaData<
			SourceNodeMetaDataType.InternSourceNodeReference
			>[]>,
			extern: Record<GlobalSourceNodeIdentifier_string, SourceNodeMetaData<
			SourceNodeMetaDataType.ExternSourceNodeReference
			>[]>,
		} = {
			lang_internal: {},
			intern: {},
			extern: {},
		}

		for (const currentSourceNodeMetaData of args) {
			if (type !== currentSourceNodeMetaData.type) {
				throw new Error('SourceNodeMetaData.merge: all SourceNodeMetaDatas should be from the same type.')
			}
			valuesToSum.profilerHits += currentSourceNodeMetaData.sensorValues.profilerHits
			valuesToSum.selfCPUTime = valuesToSum.selfCPUTime +
				currentSourceNodeMetaData.sensorValues.selfCPUTime as MicroSeconds_number
			
			valuesToSum.aggregatedCPUTime = valuesToSum.aggregatedCPUTime +
				currentSourceNodeMetaData.sensorValues.aggregatedCPUTime as MicroSeconds_number
			valuesToSum.langInternalCPUTime = valuesToSum.langInternalCPUTime +
				currentSourceNodeMetaData.sensorValues.langInternalCPUTime as MicroSeconds_number
			valuesToSum.internCPUTime = valuesToSum.internCPUTime +
				currentSourceNodeMetaData.sensorValues.internCPUTime as MicroSeconds_number
			valuesToSum.externCPUTime = valuesToSum.externCPUTime +
				currentSourceNodeMetaData.sensorValues.externCPUTime as MicroSeconds_number

			valuesToSum.selfCPUEnergyConsumption =
				valuesToSum.selfCPUEnergyConsumption +
			currentSourceNodeMetaData.sensorValues.selfCPUEnergyConsumption as MilliJoule_number
			valuesToSum.aggregatedCPUEnergyConsumption =
				valuesToSum.aggregatedCPUEnergyConsumption +
			currentSourceNodeMetaData.sensorValues.aggregatedCPUEnergyConsumption as MilliJoule_number
			valuesToSum.internCPUEnergyConsumption =
				valuesToSum.internCPUEnergyConsumption +
			currentSourceNodeMetaData.sensorValues.internCPUEnergyConsumption as MilliJoule_number
			valuesToSum.externCPUEnergyConsumption =
				valuesToSum.externCPUEnergyConsumption +
			currentSourceNodeMetaData.sensorValues.externCPUEnergyConsumption as MilliJoule_number
			valuesToSum.langInternalCPUEnergyConsumption =
				valuesToSum.langInternalCPUEnergyConsumption +
			currentSourceNodeMetaData.sensorValues.langInternalCPUEnergyConsumption as MilliJoule_number

			valuesToSum.selfRAMEnergyConsumption =
				valuesToSum.selfRAMEnergyConsumption +
				currentSourceNodeMetaData.sensorValues.selfRAMEnergyConsumption as MilliJoule_number
			valuesToSum.aggregatedRAMEnergyConsumption =
				valuesToSum.aggregatedRAMEnergyConsumption +
				currentSourceNodeMetaData.sensorValues.aggregatedRAMEnergyConsumption as MilliJoule_number
			valuesToSum.internRAMEnergyConsumption =
				valuesToSum.internRAMEnergyConsumption +
				currentSourceNodeMetaData.sensorValues.internRAMEnergyConsumption as MilliJoule_number
			valuesToSum.externRAMEnergyConsumption =
				valuesToSum.externRAMEnergyConsumption +
				currentSourceNodeMetaData.sensorValues.externRAMEnergyConsumption as MilliJoule_number
			valuesToSum.langInternalRAMEnergyConsumption =
				valuesToSum.langInternalRAMEnergyConsumption +
				currentSourceNodeMetaData.sensorValues.langInternalRAMEnergyConsumption as MilliJoule_number

			if (SourceNodeMetaData.couldHaveChildren(currentSourceNodeMetaData)) {
				for (
					const [
						langInternalsSourceNodeID,
						sourceNodeMetaData
					] of currentSourceNodeMetaData.lang_internal.entries()
				) {
					const sourceNodeIndex = currentSourceNodeMetaData.getSourceNodeIndexByID(langInternalsSourceNodeID)
					if (sourceNodeIndex === undefined) {
						throw new Error('SourceNodeMetaData.merge: could not resolve sourceNodeIndex from id')
					}
					const identifier = sourceNodeIndex.globalIdentifier().identifier

					if (!valuesToMerge.lang_internal[identifier]) {
						valuesToMerge.lang_internal[identifier] = []
					}
					valuesToMerge.lang_internal[identifier].push(sourceNodeMetaData)
				}
				for (const [internSourceNodeID, sourceNodeMetaData] of currentSourceNodeMetaData.intern.entries()) {
					const sourceNodeIndex = currentSourceNodeMetaData.getSourceNodeIndexByID(internSourceNodeID)
					if (sourceNodeIndex === undefined) {
						throw new Error('SourceNodeMetaData.merge: could not resolve sourceNodeIndex from id')
					}
					const identifier = sourceNodeIndex.globalIdentifier().identifier

					if (!valuesToMerge.intern[identifier]) {
						valuesToMerge.intern[identifier] = []
					}
					valuesToMerge.intern[identifier].push(sourceNodeMetaData)
				}

				for (const [externSourceNodeID, sourceNodeMetaData] of currentSourceNodeMetaData.extern.entries()) {
					const sourceNodeIndex = currentSourceNodeMetaData.getSourceNodeIndexByID(externSourceNodeID)
					if (sourceNodeIndex === undefined) {
						throw new Error('SourceNodeMetaData.merge: could not resolve sourceNodeIndex from id')
					}
					const identifier = sourceNodeIndex.globalIdentifier().identifier

					if (!valuesToMerge.extern[identifier]) {
						valuesToMerge.extern[identifier] = []
					}
					valuesToMerge.extern[identifier].push(sourceNodeMetaData)
				}
			}
		}

		const result = new SourceNodeMetaData(
			type,
			sourceNodeID,
			SensorValues.fromJSON(valuesToSum),
			sourceNodeIndex as T extends SourceNodeMetaDataType.Aggregate ?
				undefined : SourceNodeIndex<SourceNodeIndexType.SourceNode>
		)
		result.presentInOriginalSourceCode = presentInOriginalSourceCode

		for (const [identifier, sourceNodeMetaDatas] of Object.entries(valuesToMerge.lang_internal)) {
			const sourceNodeIndex_langInternal = sourceNodeIndex.pathIndex.moduleIndex.globalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(identifier as GlobalSourceNodeIdentifier_string)
			)
			
			result.lang_internal.set(
				sourceNodeIndex_langInternal.id as SourceNodeID_number,
				SourceNodeMetaData.merge(
					sourceNodeIndex_langInternal.id,
					sourceNodeIndex_langInternal,
					...sourceNodeMetaDatas
				)
			)
		}

		for (const [identifier, sourceNodeMetaDatas] of Object.entries(valuesToMerge.intern)) {
			const globalIdentifier = GlobalIdentifier.fromIdentifier(identifier as GlobalSourceNodeIdentifier_string)
			const sourceNodeIndex_intern = sourceNodeIndex.pathIndex.moduleIndex.getFilePathIndex('upsert', globalIdentifier.path).getSourceNodeIndex('upsert', globalIdentifier.sourceNodeIdentifier)
			result.intern.set(
				sourceNodeIndex_intern.id as SourceNodeID_number,
				SourceNodeMetaData.merge(
					sourceNodeIndex_intern.id,
					sourceNodeIndex_intern,
					...sourceNodeMetaDatas
				)
			)
		}

		for (const [identifier, sourceNodeMetaDatas] of Object.entries(valuesToMerge.extern)) {
			const sourceNodeIndex_extern = sourceNodeIndex.pathIndex.moduleIndex.globalIndex.getSourceNodeIndex(
				'upsert',
				GlobalIdentifier.fromIdentifier(identifier as GlobalSourceNodeIdentifier_string)
			)

			result.extern.set(
				sourceNodeIndex_extern.id as SourceNodeID_number,
				SourceNodeMetaData.merge(
					sourceNodeIndex_extern.id,
					sourceNodeIndex_extern,
					...sourceNodeMetaDatas
				)
			)
		}

		return result
	}

	removeFromIntern(filePath: UnifiedPath_string | UnifiedPath_string[]) {
		let filePaths: UnifiedPath_string[] = []
		if (typeof filePath === 'string') {
			filePaths = [filePath]
		} else {
			filePaths = filePath
		}
		const filePathIDs: PathID_number[] = []
		for (const filePath of filePaths) {
			const pathIndex = this.getPathIndex('get', filePath)
			if (pathIndex === undefined) {
				throw new Error('SourceNodeMetaData.removeFromIntern: could not resolve pathIndex from id')
			}
			filePathIDs.push(pathIndex.id as PathID_number)
		}

		for (const [sourceNodeID, sourceNodeMetaData] of this.intern.entries()) {
			const sourceNodeIndex = this.getSourceNodeIndexByID(sourceNodeID)
			if (sourceNodeIndex === undefined) {
				throw new Error('SourceNodeMetaData.removeFromIntern: could not resolve sourceNode from id')
			}
			
			if (filePathIDs.includes(sourceNodeIndex.pathIndex.id as PathID_number)) {
				this.sensorValues.internCPUTime = this.sensorValues.internCPUTime -
					sourceNodeMetaData.sensorValues.aggregatedCPUTime as MicroSeconds_number
				this.sensorValues.aggregatedCPUTime = this.sensorValues.aggregatedCPUTime -
					sourceNodeMetaData.sensorValues.aggregatedCPUTime as MicroSeconds_number
				this.sensorValues.internCPUEnergyConsumption = this.sensorValues.internCPUEnergyConsumption -
					sourceNodeMetaData.sensorValues.aggregatedCPUEnergyConsumption as MilliJoule_number
				this.sensorValues.aggregatedCPUEnergyConsumption = this.sensorValues.aggregatedCPUEnergyConsumption -
					sourceNodeMetaData.sensorValues.aggregatedCPUEnergyConsumption as MilliJoule_number
				this.intern.delete(sourceNodeIndex.id as SourceNodeID_number)
			}
		}
	}

	static max(
		...args: SourceNodeMetaData<SourceNodeMetaDataType>[]
	): SourceNodeMetaData<SourceNodeMetaDataType.Aggregate> {
		return new SourceNodeMetaData(
			SourceNodeMetaDataType.Aggregate,
			undefined,
			SensorValues.max(...args.map((node) => node.sensorValues)),
			undefined
		)
	}

	static sum(
		...args: SourceNodeMetaData<SourceNodeMetaDataType>[]
	): SourceNodeMetaData<SourceNodeMetaDataType.Aggregate> {
		return new SourceNodeMetaData(
			SourceNodeMetaDataType.Aggregate,
			undefined,
			SensorValues.sum(...args.map((node) => node.sensorValues)),
			undefined
		)
	}

	static equals(...args: SourceNodeMetaData<SourceNodeMetaDataType>[]) {
		if (args.length === 0) {
			return true
		}
		const compare = args[0]
		const sensorValuesAreEqual = SensorValues.equals(...args.map((node) => node.sensorValues))

		if (!sensorValuesAreEqual) {
			return sensorValuesAreEqual
		}

		for (let i = 1; i < args.length; i++) {
			const a = args[i]
			if (
				a.type !== compare.type
			) {
				return false
			}
		}
		return true
	}

	static couldHaveChildren(object: SourceNodeMetaData<SourceNodeMetaDataType>):
		object is SourceNodeMetaData<SourceNodeMetaDataTypeWithChildren> {
		return object.type === SourceNodeMetaDataType.SourceNode ||
		object.type === SourceNodeMetaDataType.LangInternalSourceNode
	}

	get lang_internal(): LangInternalMap<T> {
		if (this._lang_internal === undefined && SourceNodeMetaData.couldHaveChildren(this)) {
			(this as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>).
				_lang_internal = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
				SourceNodeMetaDataType.LangInternalSourceNodeReference
				>>('number')
		}
		return this._lang_internal as LangInternalMap<T>
	}

	get intern(): InternMap<T> {
		if (this._intern === undefined && SourceNodeMetaData.couldHaveChildren(this)) {
			(this as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>).
				_intern = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
				SourceNodeMetaDataType.InternSourceNodeReference
				>>('number')
		}
		return this._intern as InternMap<T>
	}

	get extern(): ExternMap<T> {
		if (this._extern === undefined && SourceNodeMetaData.couldHaveChildren(this)) {
			(this as SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>).
				_extern = new ModelMap<SourceNodeID_number, SourceNodeMetaData<
				SourceNodeMetaDataType.ExternSourceNodeReference
				>>('number')
		}
		return this._extern as ExternMap<T>
	}

	// IMPORTANT to change when new measurement type gets added
	addToSensorValues({
		cpuTime,
		cpuEnergyConsumption,
		ramEnergyConsumption
	}: {
		cpuTime: IPureCPUTime,
		cpuEnergyConsumption: IPureCPUEnergyConsumption,
		ramEnergyConsumption: IPureRAMEnergyConsumption
	}): SourceNodeMetaData<T> {
		this.sensorValues.selfCPUTime = this.sensorValues.selfCPUTime +
			(cpuTime.selfCPUTime || 0) as MicroSeconds_number
		this.sensorValues.aggregatedCPUTime = this.sensorValues.aggregatedCPUTime +
			(cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number

		this.sensorValues.selfCPUEnergyConsumption =
			this.sensorValues.selfCPUEnergyConsumption +
		(cpuEnergyConsumption.selfCPUEnergyConsumption || 0) as MilliJoule_number
		this.sensorValues.aggregatedCPUEnergyConsumption =
			this.sensorValues.aggregatedCPUEnergyConsumption +
		(cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
		
		this.sensorValues.selfRAMEnergyConsumption =
			this.sensorValues.selfRAMEnergyConsumption +
			(ramEnergyConsumption.selfRAMEnergyConsumption || 0) as MilliJoule_number
		this.sensorValues.aggregatedRAMEnergyConsumption =
			this.sensorValues.aggregatedRAMEnergyConsumption +
			(ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
		return this
	}

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToLangInternal(
		identifier: GlobalIdentifier,
		values: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption
		}
	): SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference> {
		if (!SourceNodeMetaData.couldHaveChildren(this)) {
			throw new Error('Cannot only add sensor values to langInternal for SourceNode and LangInternalSourceNode')
		}

		const sourceNodeIndex = this.sourceNodeIndex.pathIndex.moduleIndex.globalIndex.getSourceNodeIndex('upsert', identifier)
		const sourceNodeID = sourceNodeIndex.id as SourceNodeID_number

		let sourceNodeMetaData = this.lang_internal.get(sourceNodeID)
		if (!sourceNodeMetaData) {
			sourceNodeMetaData = new SourceNodeMetaData(
				SourceNodeMetaDataType.LangInternalSourceNodeReference,
				sourceNodeID,
				new SensorValues({}),
				sourceNodeIndex
			),
			this.lang_internal.set(sourceNodeID, sourceNodeMetaData)
		}
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({
			cpuTime: values.cpuTime,
			cpuEnergyConsumption: values.cpuEnergyConsumption,
			ramEnergyConsumption: values.ramEnergyConsumption
		})
		this.sensorValues.langInternalCPUTime = this.sensorValues.langInternalCPUTime +
			(values.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number

		this.sensorValues.langInternalCPUEnergyConsumption =
			this.sensorValues.langInternalCPUEnergyConsumption +
		(values.cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number

		this.sensorValues.langInternalRAMEnergyConsumption =
			this.sensorValues.langInternalRAMEnergyConsumption +
			(values.ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
		return sourceNodeMetaData
	}

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToIntern(
		identifier: GlobalIdentifier,
		values: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption,
		}
	): SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference> {
		if (!SourceNodeMetaData.couldHaveChildren(this)) {
			throw new Error('Cannot only add sensor values to intern for SourceNode and LangInternalSourceNode')
		}
		const sourceNodeIndex = this.sourceNodeIndex.pathIndex.moduleIndex.globalIndex.getSourceNodeIndex('upsert', identifier)
		const sourceNodeID = sourceNodeIndex.id as SourceNodeID_number

		let sourceNodeMetaData = this.intern.get(sourceNodeID)
		if (!sourceNodeMetaData) {
			sourceNodeMetaData = new SourceNodeMetaData(
				SourceNodeMetaDataType.InternSourceNodeReference,
				sourceNodeID,
				new SensorValues({}),
				sourceNodeIndex
			)
			this.intern.set(sourceNodeID, sourceNodeMetaData)
		}
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({
			cpuTime: values.cpuTime,
			cpuEnergyConsumption: values.cpuEnergyConsumption,
			ramEnergyConsumption: values.ramEnergyConsumption
		})
		this.sensorValues.internCPUTime = this.sensorValues.internCPUTime +
			(values.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number

		this.sensorValues.internCPUEnergyConsumption =
			this.sensorValues.internCPUEnergyConsumption +	
		(values.cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
		
		this.sensorValues.internRAMEnergyConsumption =
			this.sensorValues.internRAMEnergyConsumption +
			(values.ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
		return sourceNodeMetaData
	}

	// IMPORTANT to change when new measurement type gets added
	addSensorValuesToExtern(
		identifier: GlobalIdentifier,
		values: {
			cpuTime: IPureCPUTime,
			cpuEnergyConsumption: IPureCPUEnergyConsumption,
			ramEnergyConsumption: IPureRAMEnergyConsumption
		}
	): SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference> {
		if (!SourceNodeMetaData.couldHaveChildren(this)) {
			throw new Error('Cannot only add sensor values to extern for SourceNode and LangInternalSourceNode')
		}
		const sourceNodeIndex = this.sourceNodeIndex.pathIndex.moduleIndex.globalIndex.getSourceNodeIndex('upsert', identifier)
		const sourceNodeID = sourceNodeIndex.id as SourceNodeID_number

		let sourceNodeMetaData = this.extern.get(sourceNodeID)
		if (!sourceNodeMetaData) {
			sourceNodeMetaData = new SourceNodeMetaData(
				SourceNodeMetaDataType.ExternSourceNodeReference,
				sourceNodeID,
				new SensorValues({}),
				sourceNodeIndex
			)
			this.extern.set(sourceNodeID, sourceNodeMetaData)	
		}
		sourceNodeMetaData.sensorValues.profilerHits += 1
		sourceNodeMetaData.addToSensorValues({
			cpuTime: values.cpuTime,
			cpuEnergyConsumption: values.cpuEnergyConsumption,
			ramEnergyConsumption: values.ramEnergyConsumption
		})
		this.sensorValues.externCPUTime = this.sensorValues.externCPUTime +
			(values.cpuTime.aggregatedCPUTime || 0) as MicroSeconds_number

		this.sensorValues.externCPUEnergyConsumption =
			this.sensorValues.externCPUEnergyConsumption +	
		(values.cpuEnergyConsumption.aggregatedCPUEnergyConsumption || 0) as MilliJoule_number
	
		this.sensorValues.externRAMEnergyConsumption =
			this.sensorValues.externRAMEnergyConsumption +
			(values.ramEnergyConsumption.aggregatedRAMEnergyConsumption || 0) as MilliJoule_number
		return sourceNodeMetaData
	}

	validate(
		path: UnifiedPath_string | LangInternalPath_string,
		identifier: SourceNodeIdentifier_string
	) {
		let totalAggregatedTime = 0
		let totalAggregatedEnergyConsumption = 0

		if (this.type !== SourceNodeMetaDataType.SourceNode) {
			return
		}
		if (this.sourceNodeIndex?.id !== this.id) {
			throw new Error('SourceNodeMetaData.validate: Assertion error sourceNodeIndex and sourceNode id are not compatible')
		}
		this.sensorValues.validate(path, identifier)

		let totalLangInternalCPUTime = 0
		let totalLangInternalEnergyConsumption = 0
		for (const nodeMetaData of this.lang_internal.values()) {
			totalAggregatedTime += nodeMetaData.sensorValues.aggregatedCPUTime
			totalLangInternalCPUTime += nodeMetaData.sensorValues.aggregatedCPUTime

			totalAggregatedEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption
			totalLangInternalEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption

			nodeMetaData.sensorValues.validate(path, identifier)
		}
		let totalInternCPUTime = 0
		let totalInternEnergyConsumption = 0
		for (const nodeMetaData of this.intern.values()) {
			totalAggregatedTime += nodeMetaData.sensorValues.aggregatedCPUTime
			totalInternCPUTime += nodeMetaData.sensorValues.aggregatedCPUTime

			totalAggregatedEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption
			totalInternEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption

			nodeMetaData.sensorValues.validate(path, identifier)
		}
		let totalExternCPUTime = 0
		let totalExternEnergyConsumption = 0
		for (const nodeMetaData of this.extern.values()) {
			totalAggregatedTime += nodeMetaData.sensorValues.aggregatedCPUTime
			totalExternCPUTime += nodeMetaData.sensorValues.aggregatedCPUTime

			totalAggregatedEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption
			totalExternEnergyConsumption += nodeMetaData.sensorValues.aggregatedCPUEnergyConsumption
			
			nodeMetaData.sensorValues.validate(path, identifier)
		}
		if (
			totalAggregatedTime < this.sensorValues.aggregatedCPUTime - this.sensorValues.selfCPUTime ||
			totalLangInternalCPUTime !== this.sensorValues.langInternalCPUTime ||
			totalExternCPUTime !== this.sensorValues.externCPUTime ||
			totalInternCPUTime !== this.sensorValues.internCPUTime ||
			(totalAggregatedEnergyConsumption <
				this.sensorValues.aggregatedCPUEnergyConsumption - this.sensorValues.selfCPUEnergyConsumption &&
			!areNumbersClose(totalAggregatedEnergyConsumption,
				this.sensorValues.aggregatedCPUEnergyConsumption - this.sensorValues.selfCPUEnergyConsumption
			)
			) ||
			!areNumbersClose(totalLangInternalEnergyConsumption, this.sensorValues.langInternalCPUEnergyConsumption) ||
			!areNumbersClose(totalExternEnergyConsumption, this.sensorValues.externCPUEnergyConsumption) ||
			!areNumbersClose(totalInternEnergyConsumption, this.sensorValues.internCPUEnergyConsumption)
		) {
			throw new Error(
				`SourceNodeMetaData.validate: Assertion error (SourceNode validation) ${path}:${identifier} \n` +
				JSON.stringify(this, null, 2) + '\n' +
				JSON.stringify({
					totalAggregatedTime,
					totalLangInternalCPUTime,
					totalExternCPUTime,
					totalInternCPUTime,
					totalAggregatedEnergyConsumption,
					totalLangInternalEnergyConsumption,
					totalExternEnergyConsumption,
					totalInternEnergyConsumption,
					reason: {
						'totalAggregatedTime < aggregatedCPUTime - selfCPUTime': totalAggregatedTime < this.sensorValues.aggregatedCPUTime - this.sensorValues.selfCPUTime,
						'totalLangInternalCPUTime != langInternalCPUTime': totalLangInternalCPUTime !== this.sensorValues.langInternalCPUTime,
						'totalExternCPUTime != externCPUTime': totalExternCPUTime !== this.sensorValues.externCPUTime,
						'totalInternCPUTime != internCPUTime': totalInternCPUTime !== this.sensorValues.internCPUTime,

						'totalAggregatedEnergyConsumption < aggregatedEnergyConsumption - selfEnergyConsumption': !areNumbersClose(totalAggregatedEnergyConsumption,
							this.sensorValues.aggregatedCPUEnergyConsumption
							- this.sensorValues.selfCPUEnergyConsumption),
						'totalLangInternalEnergyConsumption != langInternalEnergyConsumption': !areNumbersClose(totalLangInternalEnergyConsumption, this.sensorValues.langInternalCPUEnergyConsumption),
						'totalExternEnergyConsumption != externEnergyConsumption': !areNumbersClose(totalExternEnergyConsumption, this.sensorValues.externCPUEnergyConsumption),
						'totalInternEnergyConsumption != internEnergyConsumption': !areNumbersClose(totalInternEnergyConsumption, this.sensorValues.internCPUEnergyConsumption)
					}
				}, null, 2)
			)
		}
	}

	toJSON(): ISourceNodeMetaData<T> {
		return {
			id: this.id,
			type: this.type,
			sensorValues: this.sensorValues.toJSON(),
			lang_internal: this.lang_internal?.toJSON(),
			intern: this.intern?.toJSON(),
			extern: this.extern?.toJSON()
		}
	}

	static fromJSON<
		T extends SourceNodeMetaDataType,
	>(
		json: string | ISourceNodeMetaData<T>,
		globalIndex: T extends SourceNodeMetaDataType.Aggregate ?
			undefined : GlobalIndex
	): SourceNodeMetaData<T> {
		let data: ISourceNodeMetaData<T>
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		if (data.type !== SourceNodeMetaDataType.Aggregate) {
			if (globalIndex === undefined) {
				throw new Error('SourceNodeMetaData.fromJSON: expect a globalIndex for all SourceNodeMetaDataTypes except Aggregate')
			}
			if (data.id === undefined) {
				throw new Error('SourceNodeMetaData.fromJSON: expect an ID for all SourceNodeMetaDataTypes except Aggregate')
			}
		}

		const sourceNodeIndex = data.type !== SourceNodeMetaDataType.Aggregate ?
			globalIndex!.getSourceNodeIndexByID(data.id!) : undefined
		const result = new SourceNodeMetaData(
			data.type,
			data.id,
			SensorValues.fromJSON(data.sensorValues),
			sourceNodeIndex as T extends SourceNodeMetaDataType.Aggregate ?
				undefined : SourceNodeIndex<SourceNodeIndexType.SourceNode>
		)

		if (SourceNodeMetaData.couldHaveChildren(result)) {
			if (data.lang_internal) {
				for (const [sourceNodeID_string, nodeMetaData] of Object.entries(data.lang_internal)) {
					const sourceNodeID = parseInt(sourceNodeID_string) as SourceNodeID_number
					
					result.lang_internal.set(
						sourceNodeID,
						SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.LangInternalSourceNodeReference>(
							nodeMetaData,
							globalIndex!
						)
					)
				}
			}
			if (data.intern) {
				for (const [sourceNodeID_string, nodeMetaData] of Object.entries(data.intern)) {
					const sourceNodeID = parseInt(sourceNodeID_string) as SourceNodeID_number
					result.intern.set(
						sourceNodeID,
						SourceNodeMetaData.fromJSON<SourceNodeMetaDataType.InternSourceNodeReference>(
							nodeMetaData,
							globalIndex!
						)
					)
				}
			}
			if (data.extern) {
				for (const [sourceNodeID_string, nodeMetaData] of Object.entries(data.extern)) {
					const sourceNodeID = parseInt(sourceNodeID_string) as SourceNodeID_number
					result.extern.set(
						sourceNodeID,
						SourceNodeMetaData.fromJSON(
							nodeMetaData,
							globalIndex!
						)
					)
				}
			}
		}
		
		return result as SourceNodeMetaData<T>
	}

	toBuffer(): Buffer {
		if (this.isAggregate()) {
			throw new Error('SourceNodeMetaData.toBuffer: can only be executed for non aggregate type')
		}
		const self = this as SourceNodeMetaData<Exclude<SourceNodeMetaDataType, SourceNodeMetaDataType.Aggregate>>

		const buffers = [
			BufferHelper.UIntToBuffer(self.id),
			BufferHelper.UIntToBuffer(this.type),
			this.sensorValues.toBuffer()
		]

		if (this.lang_internal !== undefined) {
			buffers.push(this.lang_internal.toBuffer())
		}
		if (this.intern !== undefined) {
			buffers.push(this.intern.toBuffer())
		}
		if (this.extern !== undefined) {
			buffers.push(this.extern.toBuffer())
		}

		return Buffer.concat(buffers)
	}

	static consumeFromBuffer<T extends SourceNodeMetaDataType>(
		buffer: Buffer,
		globalIndex: GlobalIndex
	): {
			instance: SourceNodeMetaData<T>,
			remainingBuffer: Buffer
		} {
		let remainingBuffer = buffer
		const {
			instance: sourceNodeID,
			remainingBuffer: newRemainingBuffer1
		} = BufferHelper.UIntFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer1

		const {
			instance: type,
			remainingBuffer: newRemainingBuffer2
		} = BufferHelper.UIntFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer2

		const {
			instance: sensorValues,
			remainingBuffer: newRemainingBuffer3
		} = SensorValues.consumeFromBuffer(remainingBuffer)
		remainingBuffer = newRemainingBuffer3

		let instance: SourceNodeMetaData<SourceNodeMetaDataType> | undefined = undefined
		if (type !== SourceNodeMetaDataType.SourceNode && type !== SourceNodeMetaDataType.LangInternalSourceNode) {
			const sourceNodeIndex = globalIndex.getSourceNodeIndexByID(sourceNodeID as SourceNodeID_number)
			if (sourceNodeIndex === undefined) {
				throw new Error('SourceNodeMetaData.consumeFromBuffer(SourceNode|LangInternalSourceNode): expected sourceNodeIndex to be given')
			}
			
			instance = new SourceNodeMetaData<
			Exclude<SourceNodeMetaDataType, SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.Aggregate>>(
				type,
				sourceNodeID as SourceNodeID_number,
				sensorValues,
				sourceNodeIndex
			)
		} else {
			const sourceNodeIndex = globalIndex.getSourceNodeIndexByID(sourceNodeID as SourceNodeID_number)
			if (sourceNodeIndex === undefined) {
				throw new Error('SourceNodeMetaData.consumeFromBuffer: expected sourceNodeIndex to be given')
			}
			instance = new SourceNodeMetaData<
			SourceNodeMetaDataType.SourceNode | SourceNodeMetaDataType.LangInternalSourceNode>(
				type,
				sourceNodeID as SourceNodeID_number,
				sensorValues,
				sourceNodeIndex
			)
			const { instance: lang_internal, remainingBuffer: newRemainingBuffer4 } = ModelMap.consumeFromBuffer<
			SourceNodeID_number,
			SourceNodeMetaData<SourceNodeMetaDataType.LangInternalSourceNodeReference>
			>(remainingBuffer,
				'number',
				(buffer: Buffer) => {
					return SourceNodeMetaData.consumeFromBuffer<
					SourceNodeMetaDataType.LangInternalSourceNodeReference>(buffer, globalIndex)
				}
			)
			remainingBuffer = newRemainingBuffer4
			instance._lang_internal = lang_internal

			const { instance: intern, remainingBuffer: newRemainingBuffer5 } = ModelMap.consumeFromBuffer<
			SourceNodeID_number,
			SourceNodeMetaData<SourceNodeMetaDataType.InternSourceNodeReference>
			>(remainingBuffer,
				'number',
				(buffer: Buffer) => {
					return SourceNodeMetaData.consumeFromBuffer<
					SourceNodeMetaDataType.InternSourceNodeReference>(buffer, globalIndex)
				}
			)
			remainingBuffer = newRemainingBuffer5
			instance._intern = intern

			const { instance: extern, remainingBuffer: newRemainingBuffer6 } = ModelMap.consumeFromBuffer<
			SourceNodeID_number,
			SourceNodeMetaData<SourceNodeMetaDataType.ExternSourceNodeReference>
			>(remainingBuffer,
				'number',
				(buffer: Buffer) => {
					return SourceNodeMetaData.consumeFromBuffer<
					SourceNodeMetaDataType.ExternSourceNodeReference>(buffer, globalIndex)
				}
			)
			remainingBuffer = newRemainingBuffer6
			instance._extern = extern
		}
		return {
			instance: instance as SourceNodeMetaData<T>,
			remainingBuffer
		}
	}
}