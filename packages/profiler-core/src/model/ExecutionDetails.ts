import * as fs from 'fs'

import { ProfilerConfig } from './ProfilerConfig'
import { NodeModule } from './NodeModule'
import { SystemInformation } from './SystemInformation'

import { PermissionHelper } from '../helper/PermissionHelper'
import { UnifiedPath } from '../system/UnifiedPath'
import { GitHelper } from '../helper/GitHelper'
import { TimeHelper } from '../helper/TimeHelper'
// Types
import { IProjectReportExecutionDetails, ProjectReportOrigin } from '../types'

export class ExecutionDetails {
	static async resolveExecutionDetails(config?: ProfilerConfig): Promise<IProjectReportExecutionDetails> {
		const commitHash = GitHelper.currentCommitHash()
		const commitTimestamp = GitHelper.currentCommitTimestamp()
		const timestamp = TimeHelper.getCurrentTimestamp()

		if (timestamp === undefined) {
			throw new Error('ProjectReport.resolveExecutionDetails: Could not resolve execution details.' + JSON.stringify({
				commitHash: commitHash,
				timestamp: timestamp
			}, undefined, 2))
		}
		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		const engineModule = NodeModule.currentEngineModule()

		return {
			origin: ProjectReportOrigin.pure,
			commitHash: commitHash,
			commitTimestamp: commitTimestamp,
			timestamp: timestamp,
			uncommittedChanges: undefined,
			systemInformation: await SystemInformation.collect(),
			languageInformation: {
				name: engineModule.name,
				version: engineModule.version
			},
			runTimeOptions: usedConfig.getAnonymizedRuntimeOptions()
		}
	}

	static loadFromFile(filePath: UnifiedPath): IProjectReportExecutionDetails | undefined{
		if (!fs.existsSync(filePath.toPlatformString())) {
			return undefined
		}
		const json = fs.readFileSync(filePath.toPlatformString()).toString()
		return JSON.parse(json)
	}

	static storeToFile(
		executionDetails: IProjectReportExecutionDetails,
		filePath: UnifiedPath
	): void {
		if (!fs.existsSync(filePath.dirName().toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(filePath.dirName().toPlatformString())
		}
		PermissionHelper.writeFileWithUserPermission(
			filePath.toPlatformString(),
			JSON.stringify(executionDetails)
		)
	}
}