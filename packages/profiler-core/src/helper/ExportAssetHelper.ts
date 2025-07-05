import * as fs from 'fs'

import { sync } from 'glob'

import { UnifiedPath } from '../system'
// Types
import { GitHash_string } from '../types'
import {
	ACCUMULATED_REPORT_FILE_NAME,
	EXECUTION_DETAILS_FILE_NAME,
	EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION,
	METRICS_DATA_COLLECTION_FILE_EXTENSION,
	PERFORMANCE_FILE_NAME,
	REPORT_FILE_EXTENSION,
	CPU_PROFILE_FILE_EXTENSION
} from '../constants'

export class ExportAssetHelper {
	_outputDir: UnifiedPath

	constructor(outputDir: UnifiedPath) {
		this._outputDir = outputDir
	}

	outputDir(): UnifiedPath {
		return this._outputDir
	}

	outputReportPath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}${REPORT_FILE_EXTENSION}`)
	}

	outputMetricsDataCollectionPath(title: string): UnifiedPath {
		return this.outputDir().join(
			`${title}${METRICS_DATA_COLLECTION_FILE_EXTENSION}`
		)
	}

	outputCPUProfilePath(title: string): UnifiedPath {
		return this.outputDir().join(`${title}${CPU_PROFILE_FILE_EXTENSION}`)
	}

	outputExternalResourceHelperPath(title: string): UnifiedPath {
		return this.outputDir().join(
			`${title}${EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION}`
		)
	}

	outputPerformancePath(): UnifiedPath {
		return this.outputDir().join(PERFORMANCE_FILE_NAME)
	}

	outputExecutionDetailsPath(): UnifiedPath {
		return this.outputDir().join(EXECUTION_DETAILS_FILE_NAME)
	}

	outputAccumulatedReportPath(): UnifiedPath {
		return this.outputDir().join(ACCUMULATED_REPORT_FILE_NAME)
	}

	static historyReportFileName(
		timestamp: number,
		commitHash: GitHash_string | undefined
	): string {
		return (
			timestamp.toString() +
			(commitHash ? '-' + commitHash : '') +
			REPORT_FILE_EXTENSION
		)
	}

	allReportPathsInOutputDir(): UnifiedPath[] {
		const globPattern = this.outputDir().join('**', `*${REPORT_FILE_EXTENSION}`)

		if (fs.existsSync(this.outputDir().toPlatformString())) {
			const filePaths = sync(globPattern.toString())

			return filePaths.map((filePath) => new UnifiedPath(filePath))
		}
		return []
	}

	allExternalResourcePathsInOutputDir(): UnifiedPath[] {
		const globPattern = this.outputDir().join(
			'**',
			`*${EXTERNAL_RESOURCE_HELPER_FILE_EXTENSION}`
		)

		if (fs.existsSync(this.outputDir().toPlatformString())) {
			const filePaths = sync(globPattern.toString())

			return filePaths.map((filePath) => new UnifiedPath(filePath))
		}
		return []
	}
}
