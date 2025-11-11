import { CallIdentifier } from '../CallIdentifier'

type CommonStateProps = {
	callIdentifier: CallIdentifier
	// the depth of compensation layers
	// each time the state machine enters a compensation layer (e.g. accountOwnCodeGetsExecutedByExternal)
	// this depth is increased by one
	compensationLayerDepth: number
}

type ProjectState = CommonStateProps & ({
	scope: 'project'
	type: 'intern'
	headless: false
} | {
	scope: 'project'
	type: 'lang_internal'
	headless: boolean
})

type ModuleState = CommonStateProps & {
	type: 'intern' | 'lang_internal'
	scope: 'module'
	headless: boolean
}

export type State = ProjectState | ModuleState