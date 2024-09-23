import * as fs from 'fs'

import { BaseMetricsData } from './BaseMetricsData'
import { PowerMetricsData } from './PowerMetricsData'
import { PerfMetricsData } from './PerfMetricsData'

import { UnifiedPath } from '../../system/UnifiedPath'
import { BaseModel } from '../BaseModel'
import { PermissionHelper } from '../../helper/PermissionHelper'
// Types
import {
	MetricsDataCollectionType,
	TimeInfo,
	IMetricsDataCollection,
	NanoSeconds_BigInt,
	IPowerMetricsData,
	IPerfMetricsData
} from '../../types'

export class MetricsDataCollection extends BaseModel {
	private _pid: number
	private _type: MetricsDataCollectionType
	private _items: BaseMetricsData[]

	private _timeInfo: TimeInfo // represents the timestamps when the measurement was called to start and stop (not the actual measurement start/stop)

	constructor(
		pid: number,
		type: MetricsDataCollectionType,
		items: BaseMetricsData[],
		timeInfo: TimeInfo
	) {
		super()
		this._pid = pid
		this._type = type
		this._items = items
		this._timeInfo = timeInfo
	}

	get pid(): number {
		return this._pid
	}

	get type(): MetricsDataCollectionType {
		return this._type
	}

	get items(): BaseMetricsData[] {
		return this._items
	}

	get timeInfo(): TimeInfo {
		return this._timeInfo
	}

	toJSON(): IMetricsDataCollection {
		return {
			pid: this._pid,
			type: this._type,
			items: this._items.map((x) => x.toJSON()),
			timeInfo: {
				startTime: this._timeInfo.startTime.toString(),
				stopTime: this._timeInfo.stopTime.toString()
			},
		}
	}

	storeToFile(filePath: UnifiedPath) {
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(
				filePath.dirName().toPlatformString()
			)
		}
		PermissionHelper.writeFileWithUserPermission(
			filePath.toPlatformString(),
			JSON.stringify(this)
		)
	}

	static fromJSON(json: string | IMetricsDataCollection, ...args: any[]): MetricsDataCollection {
		let data: IMetricsDataCollection
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		return new MetricsDataCollection(
			data.pid,
			data.type,
			data.items.map((x) => {
				switch (data.type) {
					case MetricsDataCollectionType.PowerMetricsPerProcess:
						return PowerMetricsData.fromJSON(x as IPowerMetricsData)
					case MetricsDataCollectionType.PerfTotalSystem:
						return PerfMetricsData.fromJSON(x as IPerfMetricsData)
				}
			}),
			{
				startTime: BigInt(data.timeInfo.startTime) as NanoSeconds_BigInt,
				stopTime: BigInt(data.timeInfo.stopTime) as NanoSeconds_BigInt
			}
		)
	}
	
	static loadFromFile(filePath: UnifiedPath): MetricsDataCollection | undefined {
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		return MetricsDataCollection.fromJSON(
			fs.readFileSync(filePath.toPlatformString()).toString()
		)
	}
}