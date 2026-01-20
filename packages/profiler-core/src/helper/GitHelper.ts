import ChildProcess, { ExecSyncOptions } from 'child_process'

import { UnifiedPath } from '../system/UnifiedPath'
// Types
import { GitHash_string } from '../types'

export class GitHelper {
	static currentCommitHash(): GitHash_string | undefined {
		const command = 'git rev-parse HEAD'
		const options: ExecSyncOptions = {
			stdio: 'pipe'
		}
		if (process.platform === 'win32') {
			options.shell = 'powershell.exe'
		}
		try {
			return ChildProcess.execSync(command, options).toString().trim() as GitHash_string
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return undefined
		}
	}

	static currentCommitTimestamp(): number | undefined {
		const command = 'git show -s --format=%ct HEAD'
		try {
			const options: ExecSyncOptions = {
				stdio: 'pipe'
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}

			const result = ChildProcess.execSync(command, options).toString().trim()
			return parseInt(result)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return undefined
		}
	}

	static getRepositoriesRootDir(): UnifiedPath | null {
		const command = 'git rev-parse --show-toplevel'
		try {
			const options: ExecSyncOptions = {
				stdio: 'pipe'
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}

			const result = ChildProcess.execSync(command, options).toString().trim()
			return new UnifiedPath(result)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return null
		}
	}

	static uncommittedFiles(): UnifiedPath[] | null {
		const repositoriesRootDir = GitHelper.getRepositoriesRootDir()
		if (repositoriesRootDir === null) {
			return null
		}

		const command = 'git diff HEAD --name-only -z'
		try {
			const options: ExecSyncOptions = {
				stdio: 'pipe'
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}

			const result = ChildProcess.execSync(command, options).toString().trim()
			return result.split('\0').map((filePath) => repositoriesRootDir.join(filePath))
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return null
		}
	}
}
