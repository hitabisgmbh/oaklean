import * as path from 'path'

import { PathUtils } from '../helper/PathUtils'
// Types
import { UnifiedPath_string, UnifiedPathPart_string } from '../types'

export class UnifiedPath {
	private readonly _unifiedPath: string
	private _parts: UnifiedPathPart_string[] | undefined

	constructor(arg?: string) {
		this._unifiedPath = PathUtils.unifyPath(arg || '')
	}

	static fromPathParts(parts: string[]) {
		return new UnifiedPath(parts[0]).join(...parts.slice(1))
	}

	copy(): UnifiedPath {
		return new UnifiedPath(this._unifiedPath)
	}

	/**
	 * String representation of a UnifiedPath
	 *
	 * @returns
	 */
	toString(): UnifiedPath_string {
		return this._unifiedPath as UnifiedPath_string
	}

	/**
	 * Returns UnifiedPath as a string for the current platform
	 *
	 * @returns
	 */
	toPlatformString(): string {
		return this._unifiedPath.split('/').join(path.sep)
	}

	/**
	 * JSON representation of a UnifiedPath
	 *
	 * @returns
	 */
	toJSON(): UnifiedPath_string {
		return this.toString()
	}

	/**
	 * Returns the directory name of a path
	 *
	 * @returns
	 */
	dirName(): UnifiedPath {
		return new UnifiedPath(path.dirname(this.toString()))
	}

	/**
	 * Returns the basename name of a path
	 *
	 * @returns The basename of the path (path/to/index.coffee.md -> index.coffee.md)
	 */
	basename(): string {
		return path.basename(this.toString())
	}

	/**
	 * Returns the file name of a path (without extension)
	 *
	 * @returns The extension of the path (path/to/index.coffee.md -> index.coffee)
	 */
	filename(): string {
		return path.parse(this.basename()).name
	}

	/**
	 * Returns the extension of a path
	 *
	 * @returns The extension of the path (path/to/index.coffee.md -> .md)
	 */
	extname(): string {
		return path.extname(this.basename())
	}

	isRelative(): boolean {
		return (
			this._unifiedPath === '' ||
			(this._unifiedPath[0] !== '/' && !this.isAbsoluteWindowsPath())
		)
	}

	isAbsoluteWindowsPath(): boolean {
		return /^[A-Za-z]:/.test(this._unifiedPath)
	}

	/**
	 * Gives the relative UnifiedPath that points from this to the other path
	 *
	 * @param other
	 * @returns
	 */
	pathTo(other: UnifiedPath | string): UnifiedPath {
		if (typeof other === 'string') {
			other = new UnifiedPath(other as string)
		}
		return new UnifiedPath(
			PathUtils.getPathRelativeTo(this.toString(), other.toString())
		)
	}

	/**
	 * Splits the path into an array of it's components
	 *
	 * @returns
	 */
	split(): UnifiedPathPart_string[] {
		if (!this._parts) {
			const parts = this._unifiedPath.split('/')
			if (parts[0] === '' && parts.length > 1) {
				parts[0] = '/'
			}
			if (parts[0] === '.' && parts.length > 1) {
				parts.splice(0, 1)
			}
			this._parts = parts as UnifiedPathPart_string[]
		}
		return this._parts
	}

	join(...args: Array<UnifiedPath | string>): UnifiedPath {
		if (args.length === 0) {
			return new UnifiedPath(this._unifiedPath)
		}
		const parts: string[] = []
		for (const part of args) {
			if (typeof part === 'string') {
				parts.push(new UnifiedPath(part as string).toString())
			} else {
				parts.push(part.toString())
			}
		}
		return new UnifiedPath(path.posix.join(this._unifiedPath, ...parts))
	}

	/**
	 * Returns the unified path from the root of the path to the first occurrence of the given directory
	 * and the remainder
	 *
	 * /path/to/node_modules/node_module_name/file -> /path/to/node_modules
	 *
	 * @param dirName
	 * @returns
	 */
	pathUntilSubDir(
		dirName: UnifiedPathPart_string
	): { match: UnifiedPath; remainder: UnifiedPath } | undefined {
		const pathParts = this.split()
		const firstMatch = pathParts.indexOf(dirName)

		if (firstMatch !== -1) {
			return {
				match: new UnifiedPath(
					path.posix.join(...pathParts.slice(0, firstMatch + 1))
				),
				remainder: new UnifiedPath(
					path.posix.join(...pathParts.slice(firstMatch + 1))
				)
			}
		}
		return undefined
	}
}
