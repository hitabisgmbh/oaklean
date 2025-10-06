import { State } from './state'
import { TransitionResult } from './transition'

import { CPUNode } from '../../CPUProfile/CPUNode'

export type StackFrame = {
	state: State
	node: CPUNode
	depth: number
	result?: TransitionResult
}
