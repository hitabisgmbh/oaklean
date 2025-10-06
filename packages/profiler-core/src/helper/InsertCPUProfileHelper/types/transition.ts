
import { State } from './state'
import { AccountingInfo } from './accounting'

import {
	NodeModule
} from '../../../model/NodeModule'
import { SensorValues } from '../../../model'
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
	ToModuleTransition | {
		transition: 'stayInState'
	}

export type TransitionResult = {
	nextState: State
	accountingInfo: AccountingInfo | null
	compensation?: SensorValues
}