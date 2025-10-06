import { CallIdentifier } from '../CallIdentifier'

type StateProps = {
	type: 'intern'
	headless: false
	callIdentifier: CallIdentifier
} | {
	type: 'lang_internal'
	headless: boolean
	callIdentifier: CallIdentifier
}

type ProjectState = StateProps & {
	scope: 'project'
}

type ModuleState = StateProps & {
	scope: 'module'
}

export type State = ProjectState | ModuleState