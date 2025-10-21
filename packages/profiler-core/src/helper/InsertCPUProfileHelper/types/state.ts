import { CallIdentifier } from '../CallIdentifier'

type CommonStateProps = {
	callIdentifier: CallIdentifier
	// the depth of compensation layers
	// each time the state machine enters a compensation layer (e.g. accountOwnCodeGetsExecutedByExternal)
	// this depth is increased by one
	compensationLayerDepth: number
}

type StateProps = ({
	type: 'intern'
	headless: false
} | {
	type: 'lang_internal'
	headless: boolean
}) & CommonStateProps

type ProjectState = StateProps & {
	scope: 'project'
}

type ModuleState = StateProps & {
	scope: 'module'
}

export type State = ProjectState | ModuleState