import { CallIdentifier } from '../../../src/helper/InsertCPUProfileHelper/CallIdentifier'
import { CPUNode } from '../../../src/helper/CPUProfile/CPUNode'
import {
	InsertCPUProfileStateMachine,
	State,
	Transition
} from '../../../src/helper/InsertCPUProfileHelper/InsertCPUProfileStateMachine'
import { ResolveFunctionIdentifierHelper } from '../../../src/helper/ResolveFunctionIdentifierHelper'
import { CPUProfileSourceLocation } from '../../../src/helper/CPUProfile/CPUProfileSourceLocation'
import { WASM_NODE_MODULE } from '../../../src/model/NodeModule'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { NodeModule } from '../../../src/model/NodeModule'
// Types
import { CPUProfileSourceLocationType, SourceNodeIdentifier_string } from '../../../src/types'

type StateIdentifier<T extends State = State> = T extends State
	? `${T['scope']}:${T['type']}:${T['headless']}`
	: never

const STATES: Record<StateIdentifier<State>, State> = {
	'project:lang_internal:false': {
		scope: 'project',
		type: 'lang_internal',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'project:lang_internal:true': {
		scope: 'project',
		type: 'lang_internal',
		headless: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'project:intern:false': {
		scope: 'project',
		type: 'intern',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:lang_internal:false': {
		scope: 'module',
		type: 'lang_internal',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:lang_internal:true': {
		scope: 'module',
		type: 'lang_internal',
		headless: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	},
	'module:intern:false': {
		scope: 'module',
		type: 'intern',
		headless: false,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callIdentifier: undefined as any
	}
}

const SOURCE_LOCATIONS: Record<CPUProfileSourceLocationType, CPUProfileSourceLocation[]> = {
	[CPUProfileSourceLocationType.LANG_INTERNAL]: [
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: '',
				functionName: '',
				scriptId: '0',
				lineNumber: 0,
				columnNumber: 0
			}
		)
	],
	[CPUProfileSourceLocationType.WASM]: [
		new CPUProfileSourceLocation(
				undefined as any,
				undefined as any,
				{
					url: 'wasm://wasm/0x12345',
					functionName: 'wasm-function[42]:0x12345',
					scriptId: '1',
					lineNumber: 0,
					columnNumber: 0
				}
			)
	],
	[CPUProfileSourceLocationType.WEBPACK]: [
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: 'webpack://./src/index.js',
				functionName: 'myFunction',
				scriptId: '1',
				lineNumber: 0,
				columnNumber: 0
			}
		),
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: 'webpack://./node_modules/module/index.js',
				functionName: 'moduleFunction',
				scriptId: '1',
				lineNumber: 0,
				columnNumber: 0
			}
		)
	],
	[CPUProfileSourceLocationType.DEFAULT]: [
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: 'file:///Users/user/project/src/index.js',
				functionName: 'myFunction',
				scriptId: '1',
				lineNumber: 0,
				columnNumber: 0
			}
		),
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: 'file:///Users/user/project/node_modules/module/index.js',
				functionName: 'moduleFunction',
				scriptId: '1',
				lineNumber: 0,
				columnNumber: 0
			}
		)
	],
	[CPUProfileSourceLocationType.EMPTY]: [
		new CPUProfileSourceLocation(
			undefined as any,
			undefined as any,
			{
				url: '',
				functionName: '',
				scriptId: '1',
				lineNumber: 0,
				columnNumber: 0
			}
		)
	]
}


const MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER = {
	resolveFunctionIdentifier(sourceLocation: CPUProfileSourceLocation) {
		switch (sourceLocation.rawUrl) {
			case 'webpack://./src/index.js':
				return {
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./src/index.js'),
						functionIdentifier:
							'{function:myFunction}' as SourceNodeIdentifier_string
					},
					functionIdentifierPresentInOriginalFile: true
				}
			case 'webpack://./node_modules/module/index.js':
				return {
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./index.js'),
						functionIdentifier:
							'{function:moduleFunction}' as SourceNodeIdentifier_string
					},
					functionIdentifierPresentInOriginalFile: true,
					nodeModule: new NodeModule('module', '1.0.0'),
					relativeNodeModulePath: new UnifiedPath('./node_modules/module')
				}
			case 'file:///Users/user/project/src/index.js':
				return {
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('src/index.js'),
						functionIdentifier:
							'{function:myFunction}' as SourceNodeIdentifier_string
					},
					functionIdentifierPresentInOriginalFile: true
				}
			case 'file:///Users/user/project/node_modules/module/index.js':
				return {
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('index.js'),
						functionIdentifier:
							'{function:moduleFunction}' as SourceNodeIdentifier_string
					},
					nodeModule: new NodeModule('module', '1.0.0'),
					relativeNodeModulePath: new UnifiedPath('node_modules/module'),
					functionIdentifierPresentInOriginalFile: true
				}
		}
	}
} as unknown as ResolveFunctionIdentifierHelper

describe('InsertCPUProfileStateMachine.getTransition', () => {
	describe('getTransition to LANG_INTERNAL', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.LANG_INTERNAL][0]
		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: false,
					headless: false
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: false,
					headless: true
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: true,
					headless: false
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: false,
					headless: false
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: false,
					headless: true
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: true,
					headless: false
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to WASM', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.WASM][0]
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('wasm/0x12345'),
			functionIdentifier:
				'wasm-function[42]:0x12345' as SourceNodeIdentifier_string
		}

		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']

			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to WEB_PACK (PROJECT_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.WEBPACK][0]
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('./src/index.js'),
			functionIdentifier: '{function:myFunction}' as SourceNodeIdentifier_string
		}

		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to WEB_PACK (MODULE_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.WEBPACK][1]
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('./index.js'),
			functionIdentifier:
				'{function:moduleFunction}' as SourceNodeIdentifier_string
		}
		const nodeModule = new NodeModule('module', '1.0.0')

		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to DEFAULT (PROJECT_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.DEFAULT][0]
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('src/index.js'),
			functionIdentifier: '{function:myFunction}' as SourceNodeIdentifier_string
		}

		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']

			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toProject',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to DEFAULT (MODULE_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.DEFAULT][1]
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('index.js'),
			functionIdentifier:
				'{function:moduleFunction}' as SourceNodeIdentifier_string
		}
		const nodeModule = new NodeModule('module', '1.0.0')

		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']

			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: false,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: false,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to EMPTY', () => {
		const sourceLocation = SOURCE_LOCATIONS[CPUProfileSourceLocationType.EMPTY][0]
		test('from STATE: project:lang_internal:false', async () => {
			const fromState = STATES['project:lang_internal:false']

			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})

		test('from STATE: project:lang_internal:true', async () => {
			const fromState = STATES['project:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})

		test('from STATE: project:intern:false', async () => {
			const fromState = STATES['project:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:false', async () => {
			const fromState = STATES['module:lang_internal:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})

		test('from STATE: module:lang_internal:true', async () => {
			const fromState = STATES['module:lang_internal:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})

		test('from STATE: module:intern:false', async () => {
			const fromState = STATES['module:intern:false']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'stayInState'
			} satisfies Transition)
		})
	})
})
