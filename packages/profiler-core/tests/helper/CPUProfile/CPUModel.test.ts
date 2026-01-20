import * as fs from 'fs'

import { CPUModel } from '../../../src/helper/CPUProfile/CPUModel'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { NanoSeconds_BigInt } from '../../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ROOT_DIR = CURRENT_DIR.join('..', '..', '..', '..', 'profiler')

describe('CPUModel', () => {
	let instance: CPUModel

	beforeEach(() => {
		const cpuProfileFilePath = CURRENT_DIR.join(
			'..',
			'..',
			'model',
			'assets',
			'CPUProfiles',
			'example001.cpuprofile'
		).toString()
		const cpuProfile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())

		instance = new CPUModel(ROOT_DIR, cpuProfile, BigInt('2345442642551333') as NanoSeconds_BigInt)
	})

	it('instance should be an instanceof CPUModel', () => {
		expect(instance instanceof CPUModel).toBeTruthy()
	})

	it('should have a method getNode()', () => {
		expect(instance.getNode).toBeTruthy()
	})
})
