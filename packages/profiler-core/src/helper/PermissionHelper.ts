import ChildProcess, { ExecSyncOptions } from 'child_process'
import * as fs from 'fs'
import path from 'path'
import os from 'os'

import {
	UnifiedPath
} from '../system/UnifiedPath'
import {
	SUDO_USER,
	SYSTEM_DRIVE
} from '../constants/env'
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
		if (SUDO_USER) {
			// change ownership from file back to the user who executed the code with sudo
			const options: ExecSyncOptions = {
			}
			if (process.platform === 'win32') {
				options.shell = 'powershell.exe'
			}
			try {
				ChildProcess.execSync(`chown ${SUDO_USER} "${path}"`, options)
			} catch {
				// do nothing
			}
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
		} catch {
			// do nothing
		}
	}

	static mkdirRecursivelyWithUserPermission(path: UnifiedPath) {
		const createdDirs = createDirectoriesRecursively(path.toPlatformString())
		for (const dir of createdDirs) {
			PermissionHelper.changeFileOwnershipBackToUser(dir)
		}
	}

	static async writeFileWithStorageFunctionWithUserPermissionAsync(
		path: UnifiedPath,
		storeFunction: () => Promise<unknown>
	) {
		const dirPath = path.dirName()
		if (!fs.existsSync(dirPath.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(dirPath)
		}
		await storeFunction()
		const filePath = path.toPlatformString()
		PermissionHelper.changeFileOwnershipBackToUser(filePath)
	}

	static writeFileWithStorageFunctionWithUserPermission(path: UnifiedPath, storeFunction: () => void) {
		const dirPath = path.dirName()
		if (!fs.existsSync(dirPath.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(dirPath)
		}
		storeFunction()
		const filePath = path.toPlatformString()
		PermissionHelper.changeFileOwnershipBackToUser(filePath)
	}

	static writeFileWithUserPermission(path: UnifiedPath, data: string | NodeJS.ArrayBufferView) {
		PermissionHelper.writeFileWithStorageFunctionWithUserPermission(path, () => {
			const filePath = path.toPlatformString()
			fs.writeFileSync(filePath, data)
		})
	}

	static checkWindowsAdminRights(): Promise<boolean> {
		return new Promise(resolve => {
			const platform = os.platform()
			if (platform !== 'win32') {
				resolve(false)
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			ChildProcess.exec('fsutil dirty query ' + SYSTEM_DRIVE, function (err, stdout, stderr) {
				if (err) {
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	}

}