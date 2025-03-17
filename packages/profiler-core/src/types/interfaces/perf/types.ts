import {
	z as zod
} from 'zod'

import { MicroSeconds_number } from '../../helper/TimeHelper'

export interface IPerfSensorInterfaceOptions {
	outputFilePath: string
	sampleInterval: MicroSeconds_number
}
export const IPerfSensorInterfaceOptions_schema = zod.object({
	outputFilePath: zod.string(),
	sampleInterval: zod.number()
})