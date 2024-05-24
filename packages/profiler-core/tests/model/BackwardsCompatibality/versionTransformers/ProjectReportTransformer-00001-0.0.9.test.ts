import fs from 'fs'

import { ProjectReportTransformer } from '../../../../src/model/BackwardsCompatibility/versionTransformers/ProjectReportTransformer-00001-0.0.9'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'

const CURRENT_DIR = new UnifiedPath(__dirname)

const testFiles = [
	{
		origin: CURRENT_DIR.join('..', 'assets', 'example001.old.oak'),
		target: CURRENT_DIR.join('..', 'assets', 'example001.new.oak')
	},
	{
		origin: CURRENT_DIR.join('..', 'assets', 'example002.old.oak'),
		target: CURRENT_DIR.join('..', 'assets', 'example002.new.oak')
	},
	{
		origin: CURRENT_DIR.join('..', 'assets', '001&002.merged.old.oak'),
		target: CURRENT_DIR.join('..', 'assets', '001&002.merged.new.oak')
	}
]

describe('ProjectReportTransformer', () => {
	test('test if it transforms correctly', () => {
		for (const { origin, target } of testFiles) {
			const data = JSON.parse(fs.readFileSync(origin.toString()).toString('utf-8'))
			const result = ProjectReportTransformer.transform_projectReport(data)

			const expectedReport = JSON.parse(fs.readFileSync(target.toString()).toString('utf-8'))
			expect(result).toEqual(expectedReport)
		}
	})
})