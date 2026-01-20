import * as fs from 'fs'

import { UnifiedPath } from '../../../../src/system/UnifiedPath'
import {
	ProjectReportOrigin,
	IProjectReportExecutionDetails,
	ISystemInformation,
	GitHash_string,
	SensorInterfaceType,
	MicroSeconds_number
} from '../../../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)

export const EXAMPLE_SYSTEM_INFORMATION: ISystemInformation = JSON.parse(
	fs
		.readFileSync(
			CURRENT_DIR.join('..', 'SystemInformation', 'example.json').toString()
		)
		.toString()
) as ISystemInformation

export const EXAMPLE_EXECUTION_DETAILS = {
	origin: ProjectReportOrigin.pure,
	commitHash: '9828760b10d33c0fd06ed12cd6b6edf9fc4d6db0' as GitHash_string,
	commitTimestamp: 1687845481077,
	timestamp: 1687845481077,
	highResolutionBeginTime: '887518894424000',
	highResolutionStopTime: '887518904424000',
	uncommittedChanges: false,
	systemInformation: EXAMPLE_SYSTEM_INFORMATION,
	languageInformation: {
		name: 'node',
		version: '20.11.1'
	},
	runTimeOptions: {
		seeds: {
			'Math.random': '0'
		},
		v8: {
			cpu: {
				sampleInterval: 1 as MicroSeconds_number
			}
		},
		sensorInterface: {
			type: SensorInterfaceType.powermetrics,
			options: {
				sampleInterval: 1000 as MicroSeconds_number,
				outputFilePath: '<anonymized>'
			}
		}
	}
} satisfies IProjectReportExecutionDetails
