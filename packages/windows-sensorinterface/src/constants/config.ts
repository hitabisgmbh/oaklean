import { UnifiedPath } from '@oaklean/profiler-core'

import { BINARY_VERSION } from './app'

const BINARY_DISTRIBUTION_PACKAGES = {
	win32: 'OakleanWindowsSensorInterface_x64'
}

export type SupportedPlatforms = keyof typeof BINARY_DISTRIBUTION_PACKAGES

export function getPlatformSpecificBinaryDirectoryPath(
	platform: SupportedPlatforms
) {
	return new UnifiedPath(__dirname).join(
		'..',
		'..',
		'bin',
		platform,
		BINARY_VERSION
	)
}

export function getPlatformSpecificBinaryPath(platform: SupportedPlatforms) {
	const dirPath = getPlatformSpecificBinaryDirectoryPath(platform)
	return dirPath.join('OakleanWindowsSensorInterface.exe')
}

export function getPlatformSpecificPackageName(platform: SupportedPlatforms) {
	return BINARY_DISTRIBUTION_PACKAGES[`${platform}`]
}

export function getPlatformSpecificDownloadLink(platform: SupportedPlatforms) {
	const platformSpecificPackageName = getPlatformSpecificPackageName(platform)

	return `https://github.com/hitabisgmbh/oaklean-windows-sensorinterface/releases/download/v${BINARY_VERSION}/${platformSpecificPackageName}.zip`
}
