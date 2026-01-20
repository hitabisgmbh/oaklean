import { LoggerHelper } from './LoggerHelper'

import { UnifiedPath } from '../system/UnifiedPath'
// Types
import {
	KNOWN_URL_PROTOCOLS,
	UrlProtocols
} from '../types/helper/UrlProtocolHelper'

const PROTOCOL_URL_REGEX = /^([^/]+):\/\//
const WEBPACK_URL_REGEX =
	/(webpack:\/\/|webpack-internal:\/\/\/)(.*?[^/])?\/([^?]*)(?:\?(.*))?$/

// prevent multiple warnings for the same protocol
const PROTOCOL_WARNING_TRACKER = new Set<UrlProtocols>()

/**
 * This helper is used to transform source paths from different protocols to the actual file path.
 *
 * E.g. webpack urls are in the format of:
 * - webpack://[namespace]/[resourcePath]?[options]
 * - webpack-internal:///[namespace]/[resourcePath]?[options]
 *
 * a also common format is:
 * - file://[path]
 *
 */
export class UrlProtocolHelper {
	static extractProtocol(url: string) {
		const matches = PROTOCOL_URL_REGEX.exec(url)
		if (matches && matches.length > 1) {
			const protocol = matches[1] as UrlProtocols
			if (
				!KNOWN_URL_PROTOCOLS.has(protocol) &&
				!PROTOCOL_WARNING_TRACKER.has(protocol)
			) {
				PROTOCOL_WARNING_TRACKER.add(protocol)
				// prevent multiple warnings for the same protocol
				LoggerHelper.warn(
					`UNKNOWN_URL_PROTOCOL_WARNING unknown protocol detected: "${matches[1]}" \n`,
					'An unknown protocol was detected, this might lead to unexpected behavior.\n',
					'Please report this issue to https://github.com/hitabisgmbh/oaklean/issues'
				)
			}
			return protocol
		}
		return null
	}

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
	): {
		url: UnifiedPath
		protocol: UrlProtocols | null
	} {
		const result = UrlProtocolHelper.parseWebpackSourceUrl(originalSource)
		if (result === null) {
			return {
				url: new UnifiedPath(originalSource),
				protocol: null
			}
		}

		return {
			url: rootDir.join(result.filePath),
			protocol: result.protocol
		}
	}

	/**
	 * Extracts the source path from a webpack internal url with the format:
	 * - webpack://[namespace]/[resourcePath]?[options]
	 * - webpack-internal:///[namespace]/[resourcePath]?[options]
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
	static parseWebpackSourceUrl(url: string): {
		protocol: UrlProtocols
		namespace: string
		filePath: string
		options: string
	} | null {
		const matches = WEBPACK_URL_REGEX.exec(url)

		if (matches && matches.length > 3) {
			const protocol =
				matches[1] === 'webpack://' ? 'webpack' : 'webpack-internal'
			const namespace = matches[2] || ''
			const filePath = matches[3] || ''
			const options = matches[4] || ''
			return {
				protocol,
				namespace,
				filePath,
				options
			}
		}
		return null
	}
}
