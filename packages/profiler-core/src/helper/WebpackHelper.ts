import { UnifiedPath } from '../system/UnifiedPath'

const WEBPACK_URL_REGEX = /(webpack|webpack-internal):\/\/(.*?[^/])?\/([^?]*)(?:\?(.*))?$/

/**
 * Helper class for webpack
 * 
 * This helper is used to transform source paths from webpack to the actual file path.
 * 
 * Webpack urls are in the format of:
 * - webpack://[namespace]/[resourcePath]?[options]
 * - webpack-internal://[namespace]/[resourcePath]?[options]
 * 
 */
export class WebpackHelper {
	/**
	 * Converts a webpack source map path to the actual file path.
	 * 
	 * In sourcemaps the source path is often a webpack url like:
	 * webpack://<module>/<file-path>
	 * 
	 * This method converts the webpack url to the actual file path.
	 * 
	 * Example:
	 * input: webpack://_N_E/node_modules/next/dist/esm/server/web/adapter.js?4fab
	 * rootDir: /Users/user/project
	 * 
	 * result: /Users/user/project/node_modules/next/dist/esm/server/web/adapter.js
	 * 
	 */
	static webpackSourceMapUrlToOriginalUrl(
		rootDir: UnifiedPath,
		originalSource: string
	) {
		const result = WebpackHelper.parseWebpackSourceUrl(originalSource)
		if (result === null) {
			return new UnifiedPath(originalSource)
		}

		return rootDir.join(result.filePath)
	}

	/**
	 * Extracts the source path from a webpack internal url with the format:
	 * - webpack://[namespace]/[resourcePath]?[options]
 	 * - webpack-internal://[namespace]/[resourcePath]?[options]
	 * 
	 * Returns:
	 * 
	 * {
	 * 		type: 'webpack' | 'webpack-internal',
	 * 		namespace: string,
	 * 		filePath: string,
	 * 		options: string
	 * }
	 * 
	 */
	static parseWebpackSourceUrl(url: string) {
		const matches = WEBPACK_URL_REGEX.exec(url)

		if (matches && matches.length > 3) {
			const type = matches[1]
			const namespace = matches[2] || ''
			const filePath = matches[3] || ''
			const options = matches[4] || ''
			return {
				type,
				namespace,
				filePath,
				options
			}
		}
		return null
	}
}