import { State } from './state'
import { TransitionResult } from './transition'

import { CPUNode } from '../../CPUProfile/CPUNode'
import { SourceNodeMetaData } from '../../../model/SourceNodeMetaData'
// Types
import { SourceNodeMetaDataType } from '../../../types'

export type StackFrame = {
	state: State
	node: CPUNode
	depth: number
	result?: TransitionResult
}

export type AwaiterStack = {
	awaiter: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode>, // the last called __awaiter function
	awaiterParent: SourceNodeMetaData<SourceNodeMetaDataType.SourceNode> | undefined // the last async function that called the __awaiter function
}[]