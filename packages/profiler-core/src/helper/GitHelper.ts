import ChildProcess, { ExecSyncOptions } from 'child_process'

import { STATIC_CONFIG_FILENAME } from '../constants/config'
// Types
import {
	GitHash_string
} from '../types'

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
		} catch (error) {
			return undefined
		}
	}

	static uncommittedFiles(): string[] | undefined {
		const command = 'git diff HEAD --name-only -z'
		try {
			const options: ExecSyncOptions = {
				stdio: 'pipe'
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}

			const result = ChildProcess.execSync(command, options).toString().trim()
			return result.split('\0')
		} catch (error) {
			return undefined
		}
	}

	static uncommittedChanges(): boolean | undefined {
		const uncommittedFiles = GitHelper.uncommittedFiles()

		if (uncommittedFiles === undefined) {
			return uncommittedFiles
		}
		if (uncommittedFiles.length === 1 && uncommittedFiles[0] === STATIC_CONFIG_FILENAME) {
			return false
		}
		return true
	}
}
