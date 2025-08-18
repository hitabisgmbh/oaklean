import {
	ModuleID_number
} from './indices/ModuleIndex'
import {
	PathID_number
} from './indices/PathIndex'
import {
	ISourceFileMetaData
} from './SourceFileMetaData'
import {
	IModuleReport
} from './ModuleReport'
import {
	ISensorValues
} from './SensorValues'

import {
	UnifiedPath_string
} from '../system/UnifiedPath'

export enum ReportKind {
	measurement = 0,
	accumulated = 1
}

export interface IReport {
	reportVersion: string,
	kind: ReportKind,
	relativeRootDir?: UnifiedPath_string
	lang_internalHeadlessSensorValues?: ISensorValues
	lang_internal?: Record<PathID_number, ISourceFileMetaData>
	intern?: Record<PathID_number, ISourceFileMetaData>
	extern?: Record<ModuleID_number, IModuleReport>
}

export enum ReportType {
	Report = 0,
	ProjectReport = 1,
	ModuleReport = 2
}
