import * as path from 'path'

import { PathUtils } from '../../src/helper/PathUtils'

describe('PathUtils', () => {
	describe('instance related', () => {
		let instance: PathUtils

		beforeEach(() => {
			instance = new PathUtils()
		})

		it('instance should be an instanceof PathUtils', () => {
			expect(instance instanceof PathUtils).toBeTruthy()
		})

		it('should have a static method sortFilePathArray()', () => {
			expect(PathUtils.sortFilePathArray).toBeTruthy()
		})

		it('should have a static method getPathRelativeTo()', () => {
			expect(PathUtils.getPathRelativeTo).toBeTruthy()
		})

		it('should have a static method makeAbsolute()', () => {
			expect(PathUtils.makeAbsolute).toBeTruthy()
		})

		it('should have a static method isAbsolute()', () => {
			expect(PathUtils.isAbsolute).toBeTruthy()
		})

		it('should have a static method unifyPath()', () => {
			expect(PathUtils.unifyPath).toBeTruthy()
		})

		it('should have a static method findUp()', () => {
			expect(PathUtils.findUp).toBeTruthy()
		})
	})

	describe('unifyPath', () => {
		it('should unify windows paths', () => {
			const windowsPath = 'C:\\\\path\\to\\file'
			const unifiedWindowsPath = 'C://path/to/file'

			expect(PathUtils.unifyPath(windowsPath)).toBe(unifiedWindowsPath)
		})

		it('should let unix paths the same', () => {
			const unixPath = '/path/to/file'

			expect(PathUtils.unifyPath(unixPath)).toBe(unixPath)
		})

		it('should prepend a dot to relative paths without one', () => {
			const relativePath1 = ''
			const relativePath2 = '.'
			const relativePath3 = 'fileName'

			expect(PathUtils.unifyPath(relativePath1)).toBe('./')
			expect(PathUtils.unifyPath(relativePath2)).toBe('./')
			expect(PathUtils.unifyPath(relativePath3)).toBe('./fileName')
		})

		it('should not prepend a dot to relative paths with one', () => {
			const relativePath1 = './'
			const relativePath2 = '../'
			const relativePath3 = './filePath'

			expect(PathUtils.unifyPath(relativePath1)).toBe('./')
			expect(PathUtils.unifyPath(relativePath2)).toBe('../')
			expect(PathUtils.unifyPath(relativePath3)).toBe('./filePath')
		})

		it('should remove trailing slashes from file paths', () => {
			const relativePath3 = './filePath/'

			expect(PathUtils.unifyPath(relativePath3)).toBe('./filePath')
		})
	})

	describe('sortFilePathArray', () => {
		const paths = [
			'/path/to/file2.txt',
			'/path/to/file10.txt',
			'/path/to/file1.txt',
			'/path/to/file20.txt',
			'/path/to/file3.txt',
			'/path/to/other/file.txt',
			'/another/path/file2.txt',
			'/another/path/file1.txt',
			'/another/path/file3.txt'
		]

		const expected = [
			'/another/path/file1.txt',
			'/another/path/file2.txt',
			'/another/path/file3.txt',
			'/path/to/file1.txt',
			'/path/to/file2.txt',
			'/path/to/file3.txt',
			'/path/to/file10.txt',
			'/path/to/file20.txt',
			'/path/to/other/file.txt'
		]
		PathUtils.sortFilePathArray(paths)

		expect(paths).toEqual(expected)
	})

	describe('PathUtils.getPathRelativeTo', () => {
		it('should return the relative path (inner)', () => {
			const platform = process.platform
			if (platform === 'win32') {
				const from = 'C:\\path\\to\\workspace'
				const expected = 'relative\\within\\the\\workspace'
				const to = `${from}\\${expected}`
	
				expect(PathUtils.getPathRelativeTo(from, to)).toBe(expected)
			} else {
				const from = '/path/to/workspace'
				const expected = 'relative/within/the/workspace'
				const to = `${from}/${expected}`

				expect(PathUtils.getPathRelativeTo(from, to)).toBe(expected)
			}

			
		})

		it('should return the relative path (outer)', () => {
			const platform = process.platform

			if (platform === 'win32') {
				const from = 'C:\\path\\to\\workspace'
				const expected = '..\\out\\of\\workspace'
				const to = 'C:\\path\\to\\out\\of\\workspace'
	
				expect(PathUtils.getPathRelativeTo(from, to)).toBe(expected)
			} else {
				const from = '/path/to/workspace'
				const expected = '../out/of/workspace'
				const to = '/path/to/out/of/workspace'

				expect(PathUtils.getPathRelativeTo(from, to)).toBe(expected)
			}
			
		})
	})

	describe('findUp', () => {
		it('finds an existing target', () => {
			expect(PathUtils.findUp('README.md', process.cwd())).toBe(path.join(process.cwd(), 'README.md'))
		})

		it('returns undefined if there is no target', () => {
			expect(PathUtils.findUp('8Jv5tMlK2nH7gF3yP0qR6XwD9cZ4vB1NmSjOeUiLpA', '/')).toBeUndefined()
		})
	})

	describe('makeAbsolute', () => {
		test('absolute paths stay absolute', () => {
			const filePath = '/path/to/file'
			expect(PathUtils.makeAbsolute(process.cwd(), filePath)).toBe(filePath)
		})

		test('return correct absolute file path', () => {
			const filePath = 'path/to/file'
			expect(PathUtils.makeAbsolute(process.cwd(), filePath)).toBe(path.join(process.cwd(), filePath))
		})
	})
})
