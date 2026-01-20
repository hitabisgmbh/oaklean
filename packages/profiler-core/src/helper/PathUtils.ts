import * as fs from 'fs'
import * as path from 'path'

const pathCollator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base'
})

export class PathUtils {
	static sortFilePathArray(filePathArray: string[]) {
		filePathArray.sort(pathCollator.compare)
	}

	static getPathRelativeTo(from: string, to: string): string {
		return path.relative(from, to)
	}

	static makeAbsolute(startDir: string, relativeFilePath: string) {
		if (PathUtils.isAbsolute(relativeFilePath)) {
			return relativeFilePath
		}
		return path.normalize(path.join(startDir, relativeFilePath))
	}

	static isAbsolute(pathString: string) {
		return (
			path.isAbsolute(pathString) || /^(?:[a-zA-Z]:)?\\?\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/.test(pathString)
		)
	}

	static unifyPath(pathString: string) {
		if (pathString === '' || pathString === '.' || pathString === './') {
			return './'
		}
		if (pathString === '/') {
			return '/'
		}
		if (pathString === '../') {
			return '../'
		}
		const isAbsolute = PathUtils.isAbsolute(pathString)
		pathString = pathString.replace(/\\/g, '/')
		pathString = pathString.replace(/\/+$/g, '')
		if (!isAbsolute) {
			if (pathString.slice(0, 2) !== './' && pathString.slice(0, 3) !== '../') {
				return './' + pathString
			}
		}
		return pathString
	}

	static findUp(filename: string, startDir: string): string | undefined {
		const { root } = path.parse(startDir)

		let tmpDir = startDir

		while (tmpDir !== root) {
			let list: string[]
			try {
				list = fs.readdirSync(tmpDir)
			} catch (e) {
				// eslint-disable-line @typescript-eslint/no-unused-vars
				break
			}
			if (list.includes(filename) && fs.statSync(path.join(tmpDir, filename)).isFile()) {
				// found
				return path.join(tmpDir, filename)
			} else {
				tmpDir = path.normalize(path.join(tmpDir, '..'))
			}
		}
		return undefined
	}
}
