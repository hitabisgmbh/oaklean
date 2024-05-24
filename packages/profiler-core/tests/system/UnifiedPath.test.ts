import { UnifiedPath } from '../../src/system/UnifiedPath'
import { UnifiedPathPart_string } from '../../src/types/UnifiedPath.types'

// Describe the module or function you want to test
describe('UnifiedPath', () => {
	it('it stringifies correctly', () => {
		const posixPath = '/path/to/file'
		const pPosix = new UnifiedPath(posixPath)

		const windowsPath = '\\path\\to\\file'
		const pWindows = new UnifiedPath(windowsPath)

		expect(pPosix.toJSON()).toBe(posixPath)
		expect(pPosix.toString()).toBe(posixPath)

		if (process.platform === 'win32') {
			expect(pPosix.toPlatformString()).toBe(windowsPath)
		} else {
			expect(pPosix.toPlatformString()).toBe(posixPath)
		}

		expect(pWindows.toJSON()).toBe(posixPath)
		expect(pWindows.toString()).toBe(posixPath)

		if (process.platform === 'win32') {
			expect(pWindows.toPlatformString()).toBe(windowsPath)
		} else {
			expect(pWindows.toPlatformString()).toBe(posixPath)
		}
	})

	it('dirName()', () => {
		const filePath = '/path/to/a/file'

		const pFile = new UnifiedPath(filePath)

		expect(
			pFile.dirName().toString()
		).toBe('/path/to/a')
	})

	it('basename()', () => {
		const filePath = '/path/to/a/file'

		const pFile = new UnifiedPath(filePath)

		expect(
			pFile.basename()
		).toBe('file')
	})

	it('pathTo()', () => {
		const dirPath = '/path/to/dir'
		const dirPathDeeper = '/path/to/a/deeper/dir'

		const p = new UnifiedPath(dirPath)
		const pDeeper = new UnifiedPath(dirPathDeeper)

		expect(p.pathTo(pDeeper).toString()).toBe('../a/deeper/dir')
		expect(pDeeper.pathTo(p).toString()).toBe('../../../dir')

		expect(p.pathTo(dirPathDeeper).toString()).toBe('../a/deeper/dir')
		expect(pDeeper.pathTo(dirPath).toString()).toBe('../../../dir')
	})

	describe('split()', () => {
		test('absolute paths', () => {
			const filePath = '/path/to/some/file'

			const p = new UnifiedPath(filePath)
			expect(p.split()).toEqual(['/', 'path', 'to', 'some', 'file'])
		})

		test('relative paths', () => {
			const filePath = './path/to/some/file'

			const p = new UnifiedPath(filePath)
			expect(p.split()).toEqual(['path', 'to', 'some', 'file'])
		})

		test('empty paths', () => {
			const filePath = ''

			const p = new UnifiedPath(filePath)
			expect(p.split()).toEqual([''])
		})
	})

	describe('fromPathParts()', () => {
		test('absolute paths', () => {
			const filePath = '/path/to/some/file'

			const p = UnifiedPath.fromPathParts(['/', 'path', 'to', 'some', 'file'])
			expect(p.toString()).toEqual(filePath)
		})

		test('relative paths', () => {
			const filePath = './path/to/some/file'

			const p = UnifiedPath.fromPathParts(['path', 'to', 'some', 'file'])
			expect(p.toString()).toEqual(filePath)
		})

		test('empty paths', () => {
			const filePath = './'

			const p = UnifiedPath.fromPathParts([''])
			expect(p.toString()).toEqual(filePath)
		})
	})

	it('join()', () => {
		const filePath = '/path/to/some/file'

		const pString = new UnifiedPath('/').join('path', 'to', 'some', 'file')

		const pObj = new UnifiedPath('/').join(
			new UnifiedPath('path'),
			new UnifiedPath('to'),
			new UnifiedPath('some'),
			new UnifiedPath('file')
		)

		const pMixed = new UnifiedPath('/').join(
			new UnifiedPath('path'),
			'to',
			'some',
			new UnifiedPath('file')
		)

		const emptyJoinString = new UnifiedPath('/').join()

		expect(pString.toString()).toBe(filePath)
		expect(pObj.toString()).toBe(filePath)
		expect(pMixed.toString()).toBe(filePath)
		expect(emptyJoinString.toString()).toBe('/')
	})

	it('pathUntilSubDir()', () => {
		const filePath = '/path/to/node_modules/node_module_name/file'

		const p = new UnifiedPath(filePath)

		const result = p.pathUntilSubDir('node_modules' as UnifiedPathPart_string)
		expect(result?.match.toString()).toBe('/path/to/node_modules')
		expect(result?.remainder.toString()).toBe('./node_module_name/file')
		expect(p.pathUntilSubDir('not_existing' as UnifiedPathPart_string)).toBe(undefined)
	})

	it('copy()', () => {
		const filePath = '/path/to/node_modules/node_module_name/file'

		const p = new UnifiedPath(filePath)
		const copy = p.copy()

		expect(p.toJSON()).toEqual(copy.toJSON())
	})

	test('isRelative', () => {
		const filePathWin = new UnifiedPath('C:\\Users\\user-name\\Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')
		const filePathRelativeWin = new UnifiedPath('Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')
		const filePathRelativeWinPrefix = new UnifiedPath('.\\Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')

		expect(filePathRelativeWinPrefix.isRelative()).toBe(true)
		expect(filePathRelativeWin.isRelative()).toBe(true)
		expect(filePathWin.isRelative()).toBe(false)

		const filePathLinux = new UnifiedPath('/Users/user-name/Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')
		const filePathRelativeLinux = new UnifiedPath('Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')
		const filePathRelativeLinuxPrefix = new UnifiedPath('./Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')
		
		expect(filePathRelativeLinuxPrefix.isRelative()).toBe(true)
		expect(filePathRelativeLinux.isRelative()).toBe(true)
		expect(filePathLinux.isRelative()).toBe(false)
	})

	test('isAbsoluteWindowsPath', () => {
		const filePathWin = new UnifiedPath('C:\\Users\\user-name\\Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')
		const filePathRelativeWin = new UnifiedPath('Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')
		const filePathRelativeWinPrefix = new UnifiedPath('.\\Desktop\\GreenIT\\profiler\\packages\\profiler\\dist\\src\\Profiler.js')
		const filePathLinux = new UnifiedPath('/Users/user-name/Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')
		const filePathRelativeLinux = new UnifiedPath('Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')
		const filePathRelativeLinuxPrefix = new UnifiedPath('./Desktop/GreenIT/profiler/packages/profiler/dist/src/Profiler.js')

		expect(filePathRelativeWinPrefix.isAbsoluteWindowsPath()).toBe(false)
		expect(filePathRelativeWin.isAbsoluteWindowsPath()).toBe(false)
		expect(filePathWin.isAbsoluteWindowsPath()).toBe(true)

		expect(filePathRelativeLinuxPrefix.isAbsoluteWindowsPath()).toBe(false)
		expect(filePathRelativeLinux.isAbsoluteWindowsPath()).toBe(false)
		expect(filePathLinux.isAbsoluteWindowsPath()).toBe(false)
	})
})