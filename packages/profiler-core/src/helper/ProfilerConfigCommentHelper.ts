import { JsoncHelper } from './JsoncHelper'

import {
	APP_NAME,
	REPORT_FILE_EXTENSION,
	CPU_PROFILE_FILE_EXTENSION,
	METRICS_DATA_COLLECTION_FILE_EXTENSION
} from '../constants'
import { IProfilerConfigFileRepresentation } from '../types/model/ProfilerConfig'

export class ProfilerConfigCommentHelper {
	static addDefaultCommentsToConfigFileContent(
		configFileContent: string
	): string {
		const jsonc = new JsoncHelper<IProfilerConfigFileRepresentation>(
			configFileContent
		)

		jsonc.setCommentIfPossible(
			['extends'],
			'Inherits configuration settings from another config file'
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'outDir'],
			'Output directory for profiles and reports'
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'outHistoryDir'],
			'Timestamped historical reports'
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'rootDir'],
			'Project source root'
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'exportV8Profile'],
			`Export ${CPU_PROFILE_FILE_EXTENSION} for external tools`
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'exportReport'],
			`Export ${REPORT_FILE_EXTENSION} file for the ${APP_NAME}VSCode Extension`
		)
		jsonc.setCommentIfPossible(
			['exportOptions', 'exportSensorInterfaceData'],
			`Export raw power sensor data (${METRICS_DATA_COLLECTION_FILE_EXTENSION} files)`
		)
		jsonc.setCommentIfPossible(
			['projectOptions', 'identifier'],
			`A unique UUID used to identify this project within the (${APP_NAME}) ecosystem`
		)
		jsonc.setCommentIfPossible(
			['runtimeOptions', 'v8', 'cpu', 'sampleInterval'],
			'Sample rate in µs (lower = higher detail/overhead)'
		)
		jsonc.setCommentIfPossible(
			['runtimeOptions', 'seeds', 'Math.random'],
			'Ensures deterministic behavior by seeding the random number generator'
		)
		jsonc.setCommentIfPossible(
			['runtimeOptions', 'sensorInterface', 'type'],
			'Power measurement tool'
		)
		jsonc.setCommentIfPossible(
			['runtimeOptions', 'sensorInterface', 'options', 'sampleInterval'],
			'Sample rate in ms (lower = higher detail/overhead)'
		)
		jsonc.setCommentIfPossible(
			['runtimeOptions', 'sensorInterface', 'options', 'outputFilePath'],
			'Temporary log for raw readings'
		)

		return jsonc.toString()
	}
}
