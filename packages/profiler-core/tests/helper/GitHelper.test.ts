import { updateErrorOptions } from '../__mocks__/git.mock'
import { GitHelper } from '../../src/helper/GitHelper'

describe('GitHelper', () => {
	beforeEach(() => {
		updateErrorOptions({
			execSync: false
		})
	})

	describe('currentCommitHash', () => {
		test('success', () => {
			expect(GitHelper.currentCommitHash()).toBe('b1370e1881d57f1436bc2c37b13a0494808e2a09')
		})

		test('error', () => {
			updateErrorOptions({ execSync: true })
			expect(GitHelper.currentCommitHash()).toBeUndefined()
		})
	})

	describe('currentCommitTimestamp', () => {
		test('success', () => {
			expect(GitHelper.currentCommitTimestamp()).toBe(1742923113)
		})

		test('error', () => {
			updateErrorOptions({ execSync: true })
			expect(GitHelper.currentCommitTimestamp()).toBeUndefined()
		})
	})

	describe('getRepositoriesRootDir', () => {
		test('success', () => {
			expect(GitHelper.getRepositoriesRootDir()?.toString()).toBe('/path/to/repo')
		})

		test('error', () => {
			updateErrorOptions({ execSync: true })
			expect(GitHelper.getRepositoriesRootDir()).toBeNull()
		})
	})

	describe('uncommittedFiles', () => {
		test('success', () => {
			const uncommittedFiles = GitHelper.uncommittedFiles()?.map((path) => path.toString())
			expect(uncommittedFiles).toEqual([
				'/path/to/repo/packages/profiler-core/src/helper/GitHelper.ts',
				'/path/to/repo/packages/profiler/src/Profiler.ts'
			])
		})

		test('error', () => {
			updateErrorOptions({ execSync: true })
			expect(GitHelper.uncommittedFiles()).toBeNull()
		})
	})
})
