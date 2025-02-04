import { UnifiedPath } from '../../src/system/UnifiedPath'
import { UrlProtocolHelper } from '../../src/helper/UrlProtocolHelper'
import { LoggerHelper } from '../../src/helper/LoggerHelper'

describe('UrlProtocolHelper', () => {
	describe('extractProtocol', () => {
		test('unknown protocol', () => {
			const loggerWarnSpy = jest.spyOn(LoggerHelper, 'warn').mockImplementation(() => undefined)
			expect(UrlProtocolHelper.extractProtocol('unknown://')).toBe('unknown')
			expect(loggerWarnSpy).toHaveBeenCalledTimes(1)
			loggerWarnSpy.mockRestore()
		})

		test('known protocols', () => {
			const loggerWarnSpy = jest.spyOn(LoggerHelper, 'warn')
			expect(UrlProtocolHelper.extractProtocol('file://')).toBe('file')
			expect(UrlProtocolHelper.extractProtocol('webpack://next/dist/compiled/react-dom/cjs/react-dom-server.edge.development.js')).toBe('webpack')
			expect(UrlProtocolHelper.extractProtocol('webpack-internal:///(rsc)/./src/app/layout.tsx')).toBe('webpack-internal')
			expect(loggerWarnSpy).not.toHaveBeenCalled()
			loggerWarnSpy.mockRestore()
		})
	})

	describe('parseWebpackInternalSourceUrl', () => {
		test('webpack with minimal viable example', () => {
			const url = 'webpack:///'

			const result = UrlProtocolHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				protocol: 'webpack',
				namespace: '',
				filePath: '',
				options: ''
			})
		})

		test('webpack', () => {
			const url = 'webpack://next/dist/compiled/react-dom/cjs/react-dom-server.edge.development.js'

			const result = UrlProtocolHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				protocol: 'webpack',
				namespace: 'next',
				filePath: 'dist/compiled/react-dom/cjs/react-dom-server.edge.development.js',
				options: ''
			})
		})

		test('webpack-internal', () => {
			const url = 'webpack-internal:///(rsc)/./src/app/layout.tsx'

			const result = UrlProtocolHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				protocol: 'webpack-internal',
				namespace: '(rsc)',
				filePath: './src/app/layout.tsx',
				options: ''
			})
		})

		test('webpack-internal with options', () => {
			const url = 'webpack://_N_E/node_modules/next/dist/esm/server/web/adapter.js?4fab'

			const result = UrlProtocolHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				protocol: 'webpack',
				namespace: '_N_E',
				filePath: 'node_modules/next/dist/esm/server/web/adapter.js',
				options: '4fab'
			})
		})

		test('not a webpack url', () => {
			const url = './src/app/layout.tsx'

			const result = UrlProtocolHelper.parseWebpackSourceUrl(url)

			expect(result).toBeNull()
		})
		
	})

	test('webpackSourceMapUrlToOriginalUrl', () => {
		const rootDir = new UnifiedPath('/Users/user/project')
		const originalSource = 'webpack://_N_E/node_modules/next/dist/esm/server/web/adapter.js?4fab'

		const result = UrlProtocolHelper.webpackSourceMapUrlToOriginalUrl(rootDir, originalSource)

		expect(result).toEqual({
			url: new UnifiedPath('/Users/user/project/node_modules/next/dist/esm/server/web/adapter.js'),
			protocol: 'webpack'
		})
	})
})