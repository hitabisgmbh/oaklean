import {
	ISensorValues,
	CPUNode,
	MicroSeconds_number,
	CPUProfileSourceLocation,
	ResolveFunctionIdentifierHelper
} from '@oaklean/profiler-core/src'

export type MockedCPUModel = {
	location: CPUProfileSourceLocation
	profilerHits: number
	sensorValues: ISensorValues
	children?: MockedCPUModel[]
}

export function mockedCPUModel(mocked: MockedCPUModel, idx: number = 0): CPUNode {
	return {
		index: idx++,
		sourceLocation: mocked.location,
		get profilerHits() {
			return mocked.profilerHits
		},
		get sensorValues() {
			return mocked.sensorValues
		},
		childrenCount: mocked.children?.length ?? 0,
		*reversedChildren() {
			if (mocked.children !== undefined) {
				for (let i = mocked.children.length - 1; i >= 0; i--) {
					yield mockedCPUModel(mocked.children[i], idx++)
				}
			}
		}
	} as CPUNode
}
/**
 * Creates a mocked CPUModel with a chain of locations.
 * The first location in the array will be the root, the last location will be the deepest child.
 * Each node will have profilerHits by 1 and selfCPUTime increasing by 10 for each depth level below it.
 * The aggregatedCPUTime will be the sum of selfCPUTime of itself and all its children.
 *
 * E.g. for locations = [A, B, C]:
 * - A: profilerHits = 3, selfCPUTime = 30, aggregatedCPUTime = 60
 *  - B: profilerHits = 2, selfCPUTime = 20, aggregatedCPUTime = 30
 * 	  - C: profilerHits = 1, selfCPUTime = 10, aggregatedCPUTime = 10
 */
export function createLocationChainCPUModel(locations: CPUProfileSourceLocation[]) {
	let aggregatedCPUTime: MicroSeconds_number = 0 as MicroSeconds_number
	let currentRoot: MockedCPUModel | undefined = undefined
	for (let i = 0; i < locations.length; i++) {
		aggregatedCPUTime = (aggregatedCPUTime + (i + 1) * 10) as MicroSeconds_number

		currentRoot = {
			location: locations[locations.length - 1 - i],
			profilerHits: i + 1,
			sensorValues: {
				selfCPUTime: ((i + 1) * 10) as MicroSeconds_number,
				aggregatedCPUTime
			},
			children: currentRoot === undefined ? undefined : [currentRoot]
		}
	}
	if (currentRoot === undefined) {
		throw new Error('createMockedCPUModel: locations must not be empty')
	}
	return currentRoot
}

type LocationTreeNode = [CPUProfileSourceLocation, LocationTreeNode[]]

/**
 * Creates a mocked CPUModel with a tree of locations.
 * Each node will have profilerHits by 1 and selfCPUTime increasing by 10 for each depth level above it.
 * The aggregatedCPUTime will be the sum of selfCPUTime of itself and all its children.
 *
 * E.g. for locations = [A, B, C]:
 * - A: profilerHits = 1, selfCPUTime = 10, aggregatedCPUTime = 80
 * 	- B: profilerHits = 2, selfCPUTime = 20, aggregatedCPUTime = 50
 * 		- C: profilerHits = 3, selfCPUTime = 30, aggregatedCPUTime = 30
 *  - B: profilerHits = 2, selfCPUTime = 20, aggregatedCPUTime = 20
 */
export function createLocationTreeCPUModel(node: LocationTreeNode, currentLevel: number = 1) {
	const result: MockedCPUModel = {
		location: node[0],
		profilerHits: currentLevel,
		sensorValues: {
			selfCPUTime: (currentLevel * 10) as MicroSeconds_number,
			aggregatedCPUTime: (currentLevel * 10) as MicroSeconds_number
		}
	}
	const children = []
	for (let i = 0; i < node[1].length; i++) {
		const childCPUNode = createLocationTreeCPUModel(node[1][i], currentLevel + 1)

		children.push(childCPUNode)
		result.sensorValues.aggregatedCPUTime = ((result.sensorValues.aggregatedCPUTime || 0) +
			(childCPUNode.sensorValues.aggregatedCPUTime || 0)) as MicroSeconds_number
	}
	result.children = children

	return result
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
