import { CPUNode } from '../../../src/helper/CPUProfile/CPUNode'
import { ResolveFunctionIdentifierHelper } from '../../../src/helper/ResolveFunctionIdentifierHelper'
import { CPUProfileSourceLocation } from '../../../src/helper/CPUProfile/CPUProfileSourceLocation'
// Types
import {
	ISensorValues,
} from '../../../src/types'

export type MockedCPUModel = {
	location: CPUProfileSourceLocation,
	profilerHits: number,
	sensorValues: ISensorValues,
	children?: MockedCPUModel[]
}

export function mockedCPUModel(
	mocked: MockedCPUModel
): CPUNode {
	return {
		sourceLocation: mocked.location,
		get profilerHits() {
			return mocked.profilerHits
		},
		get sensorValues() {
			return mocked.sensorValues
		},
		*reversedChildren() {
			if (mocked.children !== undefined) {
				for (let i = mocked.children.length - 1; i >= 0; i--) {
					yield mockedCPUModel(mocked.children[i])
				}
			}
		}
	} as CPUNode
}

export const MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER = {
	resolveFunctionIdentifier(sourceLocation: CPUProfileSourceLocation) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((sourceLocation as any).resolved === undefined) {
			throw new Error('Mocked ResolveFunctionIdentifierHelper: sourceLocation has no resolved property')
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (sourceLocation as any).resolved
	}
} as unknown as ResolveFunctionIdentifierHelper
