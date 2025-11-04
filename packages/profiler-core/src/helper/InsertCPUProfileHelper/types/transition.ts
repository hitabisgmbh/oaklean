
import { State } from './state'
import { AccountingInfo, Compensation } from './accounting'

import {
	NodeModule
} from '../../../model/NodeModule'
// Types
import {
	ResolvedSourceNodeLocation
} from '../../../types'

type TransitionOptions = {
	createLink: boolean
	headless: boolean
}

type SourceLocationTransitionOptions = {
	sourceNodeLocation: ResolvedSourceNodeLocation
	presentInOriginalSourceCode: boolean
}

type ProjectTransitionOptions = TransitionOptions & SourceLocationTransitionOptions

type ModuleTransitionOptions = TransitionOptions & SourceLocationTransitionOptions & {
	nodeModule: NodeModule
}

export type ToProjectTransition = {
	transition: 'toProject'
	options: ProjectTransitionOptions
}

export type ToLangInternalTransition = {
	transition: 'toLangInternal'
	options: TransitionOptions
}

export type ToModuleTransition = { 
	transition: 'toModule'
	options: ModuleTransitionOptions
}

export type Transition = 
	ToProjectTransition |
	ToLangInternalTransition |
	ToModuleTransition

export type TransitionResult = {
	nextState: State
	accountingInfo: AccountingInfo
	compensation?: Compensation
}