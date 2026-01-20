import { CPUProfileSourceLocation } from '../../../src/helper/CPUProfile/CPUProfileSourceLocation'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { ILocation } from '../../../lib/vscode-js-profile-core/src/cpu/model'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ROOT_DIR = CURRENT_DIR.join('..', '..', '..', '..', '..')

describe('CPUProfileSourceLocation', () => {
	let instance: CPUProfileSourceLocation

	beforeEach(() => {
		const sourceLocation: ILocation = {
			id: 4,
			selfTime: 0,
			aggregateTime: 83,
			ticks: 0,
			category: 2,
			callFrame: {
				functionName: 'startProfiling',
				scriptId: '612',
				url: 'node_modules/v8-profiler-next/dispatch.js',
				lineNumber: 249,
				columnNumber: 28
			},
			src: {
				lineNumber: 250,
				columnNumber: 29,
				source: {
					name: 'node_modules/v8-profiler-next/dispatch.js',
					path: 'node_modules/v8-profiler-next/dispatch.js',
					sourceReference: 0
				}
			}
		}

		instance = new CPUProfileSourceLocation(ROOT_DIR, sourceLocation.id, sourceLocation.callFrame)
	})

	it('instance should be an instanceof CPUProfileSourceLocation', () => {
		expect(instance instanceof CPUProfileSourceLocation).toBeTruthy()
	})

	test('sourceLocation', () => {
		expect(instance.sourceLocation).toEqual({
			lineNumber: 249,
			columnNumber: 28
		})
	})

	test('isLangInternal', () => {
		expect(instance.isLangInternal).toEqual(false)
	})

	test('rawUrl', () => {
		expect(instance.rawUrl).toEqual('node_modules/v8-profiler-next/dispatch.js')
	})

	test('absoluteUrl', () => {
		expect(instance.absoluteUrl.toString()).toEqual(
			ROOT_DIR.join('./node_modules/v8-profiler-next/dispatch.js').toString()
		)
	})

	test('relativeUrl', () => {
		expect(instance.relativeUrl.toString()).toBe('./node_modules/v8-profiler-next/dispatch.js')
	})

	test('sourceNodeIdentifier', () => {
		expect(instance.sourceNodeIdentifier).toBe('{startProfiling}')
	})
})
