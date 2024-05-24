import * as fs from 'fs'

import { CPUModel } from '../../src/helper/CPUModel'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { NanoSeconds_BigInt } from '../../src/helper/TimeHelper'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('CPUModel', () => {
	let instance: CPUModel

	beforeEach(() => {
		const cpuProfileFilePath = CURRENT_DIR.join('..', 'model', 'assets', 'CPUProfiles', 'example001.cpuprofile').toString()
		const cpuProfile = JSON.parse(fs.readFileSync(cpuProfileFilePath).toString())
		const rootDir = CURRENT_DIR.join('..', '..', '..', 'profiler')

		instance = new CPUModel(
			rootDir,
			cpuProfile,
			BigInt('2345442642551333') as NanoSeconds_BigInt
		)
	})

	it('instance should be an instanceof CPUModel', () => {
		expect(instance instanceof CPUModel).toBeTruthy()
	})

	it('should have a method getNode()', () => {
		expect(instance.getNode).toBeTruthy()
	})
})