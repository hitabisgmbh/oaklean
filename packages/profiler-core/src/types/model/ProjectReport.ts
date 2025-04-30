import {
	IReport
} from './Report'
import {
	IGlobalIndex
} from './indices/GlobalIndex'
import {
	ISystemInformation
} from './SystemInformation'
import {
	RuntimeOptions
} from './ProfilerConfig'

import {
	UUID_string
} from '../system/Crypto'
import {
	GitHash_string
} from '../helper/GitHelper'

const ProjectIdentifierSymbol: unique symbol = Symbol('ProjectIdentifierSymbol')
export type ProjectIdentifier_string = UUID_string & { [ProjectIdentifierSymbol]: never }

export type IProjectMetaData = {
	projectID: ProjectIdentifier_string
}

export type ILanguageInformation = {
	name: string,
	version: string
}
export enum ProjectReportOrigin {
	pure = 'pure', // if measurements were made via the pure profiler, without the profiler-jest-environment
	jestEnv = 'profiler-jest-environment' // if measurements were made via the profiler-jest-environment
}
export type IProjectReportExecutionDetails = {
	origin: ProjectReportOrigin,
	commitHash: GitHash_string | undefined
	commitTimestamp: number | undefined,
	uncommittedChanges: boolean | undefined
	timestamp: number
	highResolutionBeginTime?: string // value is stored in nano seconds(NanoSeconds_BigInt), but for serialization purposes it is a string
	highResolutionStopTime?: string // value is stored in nano seconds(NanoSeconds_BigInt), but for serialization purposes it is a string
	systemInformation: ISystemInformation,
	languageInformation: ILanguageInformation
	runTimeOptions: RuntimeOptions
}

export interface IProjectReport extends IReport {
	projectMetaData: IProjectMetaData
	executionDetails: IProjectReportExecutionDetails,
	globalIndex: IGlobalIndex
}