import {
	State
} from '../../../../src/helper/InsertCPUProfileHelper/types/state'

type StateIdentifier<T extends State = State> = T extends State
	? `${T['scope']}:${T['type']}:${T['headless']}`
	: never

export const STATES: Record<StateIdentifier<State>, State> = {
	'project:lang_internal:false': {
		scope: 'project',
		type: 'lang_internal',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'project:lang_internal:true': {
		scope: 'project',
		type: 'lang_internal',
		headless: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'project:intern:false': {
		scope: 'project',
		type: 'intern',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:lang_internal:false': {
		scope: 'module',
		type: 'lang_internal',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:lang_internal:true': {
		scope: 'module',
		type: 'lang_internal',
		headless: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:intern:false': {
		scope: 'module',
		type: 'intern',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		compensationLayerDepth: undefined as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	}
}