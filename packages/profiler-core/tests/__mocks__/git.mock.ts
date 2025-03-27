import { ExecSyncOptions } from 'child_process'

type ErrorOptions = {
	execSync: boolean
}

let error: ErrorOptions = {
	execSync: false
}

export function updateErrorOptions(
	options: ErrorOptions
) {
	error = {
		...error,
		...options
	}
}

jest.mock('child_process', () => ({
	execSync: jest.fn().mockImplementation(
		(command: string, options?: ExecSyncOptions) => {
			if (error.execSync) {
				throw new Error('child_process.execSync error')
			}

			switch (command) {
				case 'git rev-parse HEAD':
					return 'b1370e1881d57f1436bc2c37b13a0494808e2a09'
				case 'git show -s --format=%ct HEAD':
					return '1742923113'
				case 'git rev-parse --show-toplevel':
					return '/path/to/repo'
				case 'git diff HEAD --name-only -z':
					return 'packages/profiler-core/src/helper/GitHelper.ts\0packages/profiler/src/Profiler.ts'
				default:
					return `NOT_DEFINED_MOCK_RESULT for: ${command}`
			}
		})
}))