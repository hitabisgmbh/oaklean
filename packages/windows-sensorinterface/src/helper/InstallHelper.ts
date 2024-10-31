import * as fs from 'fs'
import https from 'https'

import { LoggerHelper, UnifiedPath } from '@oaklean/profiler-core'

import { ZipHelper } from './ZipHelper'

import {
	SupportedPlatforms,
	getPlatformSpecificPackageName,
	getPlatformSpecificDownloadLink,
	getPlatformSpecificBinaryPath,
	getPlatformSpecificBinaryDirectoryPath
} from '../constants/config'
import { VERSION } from '../constants/app'


export class InstallHelper {
	static makeRequest(url: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			https
				.get(url, (response) => {
					if (response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 300) {
						const chunks: any[] = []
						response.on('data', (chunk) => chunks.push(chunk))
						response.on('end', () => {
							resolve(Buffer.concat(chunks))
						})
					} else if (
						response.statusCode !== undefined &&
						response.statusCode >= 300 &&
						response.statusCode < 400 &&
						response.headers.location
					) {
						// Follow redirects
						InstallHelper.makeRequest(response.headers.location).then(resolve, reject)
					} else {
						reject(
							new Error(
								`npm responded with status code ${response.statusCode} when downloading the package!`
							)
						)
					}
				})
				.on('error', (error) => {
					reject(error)
				})
		})
	}

	static async downloadPlatformSpecificBinary(platform: SupportedPlatforms) {
		// Download the tarball of the right binary distribution package
		const tarballDownloadBuffer = await InstallHelper.makeRequest(getPlatformSpecificDownloadLink(platform))

		ZipHelper.extractSpecificDirectory(
			tarballDownloadBuffer,
			new UnifiedPath('./'),
			getPlatformSpecificBinaryDirectoryPath(platform)
		)
	}

	static isPlatformSpecificPackageInstalled(platform: SupportedPlatforms) {
		return fs.existsSync(getPlatformSpecificBinaryPath(platform).toPlatformString())
	}

	static installPlatformSpecificPackage(platform: SupportedPlatforms) {
		const platformSpecificPackageName = getPlatformSpecificPackageName(platform)

		if (!platformSpecificPackageName) {
			throw new Error('Platform not supported!')
		}

		// Skip downloading the binary if it was already installed via optionalDependencies
		if (!InstallHelper.isPlatformSpecificPackageInstalled(platform)) {
			LoggerHelper.log('Platform specific package not found. Will manually download binary.')
			InstallHelper.downloadPlatformSpecificBinary(platform)
		}
	}
}