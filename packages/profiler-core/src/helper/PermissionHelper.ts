import ChildProcess, { ExecSyncOptions } from 'child_process'
import * as fs from 'fs'
import path from 'path'

import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	PermissionTypes
} from '../types'

/**
	 * Get a flat list of all directories that were created recursively
	 * @param {string} targetDir - Directory path to create recursively
	 * @returns {string[]} - List of directories
	 */
function createDirectoriesRecursively(targetDir: string) {
	const createdDirectories = []
	const segments = targetDir.split(path.sep)

	// Start from the root or the current directory based on the path type
	const isAbsoluteWindowsPath = /^[A-Za-z]:/.test(targetDir)
	let windowsPrefix = ''
	if (isAbsoluteWindowsPath) {
		const matches = /^[A-Za-z]:/.exec(targetDir)
		windowsPrefix = (matches && matches?.length > 0 ? matches[0] : '')
		if (windowsPrefix !== '' && segments.length > 0) {
			segments.shift()
		}
	}

	let currentPath = path.isAbsolute(targetDir) ? (isAbsoluteWindowsPath ? windowsPrefix : '') + path.sep : '.'

	for (const segment of segments) {
		if (segment) {
			currentPath = path.join(currentPath, segment)
			if (!fs.existsSync(currentPath)) {
				fs.mkdirSync(currentPath)
				createdDirectories.push(currentPath)
			}
		}
	}

	return createdDirectories
}

export class PermissionHelper {
	static changeFileOwnershipBackToUser(path: string) {
		const sudoUser = process.env.SUDO_USER

		if (sudoUser) {
			// change ownership from file back to the user who executed the code with sudo
			const options: ExecSyncOptions = {
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}
			try {
				ChildProcess.execSync(`chown ${sudoUser} "${path}"`, options)
			} catch {}
		}
	}

	static changeFilePermission(path: string, permissions: PermissionTypes) {
		if (process.platform === 'win32') {
			return
		}
		const options: ExecSyncOptions = {
		}
		// if (process.platform === 'win32') {
		// 	options.shell = 'powershell.exe'
		// }
		try {
			ChildProcess.execSync(`chmod ${permissions} "${path}"`, options)
		} catch { }
	}

	static mkdirRecursivelyWithUserPermission(path: UnifiedPath | string) {
		const dirPath = typeof path === 'string' ? path : path.toPlatformString()

		const createdDirs = createDirectoriesRecursively(dirPath)
		for (const dir of createdDirs) {
			PermissionHelper.changeFileOwnershipBackToUser(dir)
		}
	}

	static writeFileWithUserPermission(file: string, data: string | NodeJS.ArrayBufferView) {
		fs.writeFileSync(file, data)
		PermissionHelper.changeFileOwnershipBackToUser(file)
	}
}