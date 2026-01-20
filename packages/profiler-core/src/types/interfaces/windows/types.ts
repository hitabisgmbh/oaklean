import { z as zod } from 'zod'

import { MicroSeconds_number } from '../../helper/TimeHelper'

export interface IWindowsSensorInterfaceOptions {
	outputFilePath: string
	sampleInterval: MicroSeconds_number
}
export const IWindowsSensorInterfaceOptions_schema = zod.object({
	outputFilePath: zod.string(),
	sampleInterval: zod.number()
})
