import { z as zod } from 'zod'

import { MicroSeconds_number } from '../../helper/TimeHelper'

export interface IPowerMetricsSensorInterfaceOptions {
	outputFilePath: string
	sampleInterval: MicroSeconds_number
}
export const IPowerMetricsSensorInterfaceOptions_schema = zod.object({
	outputFilePath: zod.string(),
	sampleInterval: zod.number()
})
