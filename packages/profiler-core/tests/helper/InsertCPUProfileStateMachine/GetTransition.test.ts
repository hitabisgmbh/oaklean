// Test Assets
import {
	SOURCE_LOCATIONS_DEFAULT,
	SOURCE_LOCATIONS_EMPTY,
	SOURCE_LOCATIONS_LANG_INTERNAL,
	SOURCE_LOCATIONS_WEBPACK,
	SOURCE_LOCATIONS_WASM
} from './assets/SourceLocations'
import { STATES } from './assets/States'
import {
	MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
} from './mock'

import {
	Transition
} from '../../../src/helper/InsertCPUProfileHelper/types/transition'
import {
	InsertCPUProfileStateMachine,
} from '../../../src/helper/InsertCPUProfileHelper/InsertCPUProfileStateMachine'
import { WASM_NODE_MODULE } from '../../../src/model/NodeModule'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { NodeModule } from '../../../src/model/NodeModule'
// Types
import {
	SourceNodeIdentifier_string
} from '../../../src/types'

describe('InsertCPUProfileStateMachine.getTransition', () => {
	describe('getTransition to LANG_INTERNAL', () => {
		const sourceLocation = SOURCE_LOCATIONS_LANG_INTERNAL['default']
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

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toLangInternal',
				options: {
					createLink: true,
					headless: true
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to WASM', () => {
		const sourceLocation = SOURCE_LOCATIONS_WASM['default']
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
					headless: true,
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
					headless: true,
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
		
		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: true,
					nodeModule: WASM_NODE_MODULE,
					presentInOriginalSourceCode: false,
					sourceNodeLocation
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to WEB_PACK (PROJECT_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS_WEBPACK['project-index-0']
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

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
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
		const sourceLocation = SOURCE_LOCATIONS_WEBPACK['moduleA-index-0']
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('./index.js'),
			functionIdentifier:
				'{function:moduleFunction}' as SourceNodeIdentifier_string
		}
		const nodeModule = new NodeModule('moduleA', '1.0.0')

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
					headless: true,
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
					headless: true,
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

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: true,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to DEFAULT (PROJECT_SCOPE)', () => {
		const sourceLocation = SOURCE_LOCATIONS_DEFAULT['project-fileA-0']
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('src/fileA.js'),
			functionIdentifier: '{function:projectFunction_fileA_0}' as SourceNodeIdentifier_string
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

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
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
		const sourceLocation = SOURCE_LOCATIONS_DEFAULT['moduleA-fileA-0']
		const sourceNodeLocation = {
			relativeFilePath: new UnifiedPath('fileA.js'),
			functionIdentifier:
				'{function:moduleFunction_fileA_0}' as SourceNodeIdentifier_string
		}
		const nodeModule = new NodeModule('moduleA', '1.0.0')

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
					headless: true,
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
					headless: true,
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

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
			const transition = await InsertCPUProfileStateMachine.getTransition(
				fromState,
				sourceLocation,
				MOCKED_RESOLVE_FUNCTION_IDENTIFIER_HELPER
			)
			expect(transition).toEqual({
				transition: 'toModule',
				options: {
					createLink: true,
					headless: true,
					presentInOriginalSourceCode: true,
					sourceNodeLocation,
					nodeModule
				}
			} satisfies Transition)
		})
	})

	describe('getTransition to EMPTY', () => {
		const sourceLocation = SOURCE_LOCATIONS_EMPTY['default']
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
				}
			} satisfies Transition)
		})

		test('from STATE: module:intern:true', async () => {
			const fromState = STATES['module:intern:true']
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
					presentInOriginalSourceCode: false,
					sourceNodeLocation: {
						relativeFilePath: new UnifiedPath('./<unknown-scripts>/1'),
						functionIdentifier: '{root}' as SourceNodeIdentifier_string
					}
				}
			} satisfies Transition)
		})
	})
})