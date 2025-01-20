import { UnifiedPath } from '../../src/system/UnifiedPath'
import { WebpackHelper } from '../../src/helper/WebpackHelper'

describe('WebpackHelper', () => {
	describe('parseWebpackInternalSourceUrl', () => {
		test('webpack with minimal viable example', () => {
			const url = 'webpack:///'

			const result = WebpackHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				type: 'webpack',
				namespace: '',
				filePath: '',
				options: ''
			})
		})

		test('webpack', () => {
			const url = 'webpack://next/dist/compiled/react-dom/cjs/react-dom-server.edge.development.js'

			const result = WebpackHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				type: 'webpack',
				namespace: 'next',
				filePath: 'dist/compiled/react-dom/cjs/react-dom-server.edge.development.js',
				options: ''
			})
		})

		test('webpack-internal', () => {
			const url = 'webpack-internal:///(rsc)/./src/app/layout.tsx'

			const result = WebpackHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				type: 'webpack-internal',
				namespace: '/(rsc)',
				filePath: './src/app/layout.tsx',
				options: ''
			})
		})

		test('webpack-internal with options', () => {
			const url = 'webpack://_N_E/node_modules/next/dist/esm/server/web/adapter.js?4fab'

			const result = WebpackHelper.parseWebpackSourceUrl(url)

			expect(result).toEqual({
				type: 'webpack',
				namespace: '_N_E',
				filePath: 'node_modules/next/dist/esm/server/web/adapter.js',
				options: '4fab'
			})
		})

		test('not a webpack url', () => {
			const url = './src/app/layout.tsx'

			const result = WebpackHelper.parseWebpackSourceUrl(url)

			expect(result).toBeNull()
		})
		
	})

	test('webpackSourceMapUrlToOriginalUrl', () => {
		const rootDir = new UnifiedPath('/Users/user/project')
		const originalSource = 'webpack://_N_E/node_modules/next/dist/esm/server/web/adapter.js?4fab'

		const result = WebpackHelper.webpackSourceMapUrlToOriginalUrl(rootDir, originalSource)

		expect(result.toString()).toBe('/Users/user/project/node_modules/next/dist/esm/server/web/adapter.js')
	})
})	