import * as fs from 'fs'
import https from 'https'

import ProgressBar from 'progress'
import { LoggerHelper, UnifiedPath } from '@oaklean/profiler-core'

import { ZipHelper } from './ZipHelper'
import { formatTime } from './formatTime'

import {
	SupportedPlatforms,
	getPlatformSpecificPackageName,
	getPlatformSpecificDownloadLink,
	getPlatformSpecificBinaryPath,
	getPlatformSpecificBinaryDirectoryPath
} from '../constants/config'

export class InstallHelper {
	static makeRequest(url: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			https
				.get(url, async (response) => {
					if (response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 300) {
						const totalLength = parseInt(response.headers['content-length'] || '0', 10)
						if (totalLength) {
							LoggerHelper.appPrefix.log(
								`File size (${(totalLength / (1024 * 1024)).toFixed(2)} MB)`
							)
						}
						let downloaded = 0
						const startTime = Date.now()
						
						const progressBar = new ProgressBar(
							'-> downloading [:bar] :percent :rate/bps ETA: :remainingTime',
							{
								width: 40,
								total: totalLength || 0,
								complete: '=',
								incomplete: ' ',
								renderThrottle: 100
							}
						)

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const chunks: any[] = []
						response.on('data', (chunk) => {
							downloaded += chunk.length
							progressBar.tick(chunk.length, {
								remainingTime: formatTime(
									((totalLength - downloaded) / downloaded) *
										((Date.now() - startTime) / 1000)
								)
							})
							chunks.push(chunk)
						})
						response.on('end', () => {
							response.destroy()
							progressBar.terminate()
							resolve(Buffer.concat(chunks))
						})
					} else if (
						response.statusCode !== undefined &&
						response.statusCode >= 300 &&
						response.statusCode < 400 &&
						response.headers.location
					) {
						// Follow redirects
						response.destroy()
						InstallHelper.makeRequest(response.headers.location).then(resolve, reject)
					} else {
						reject(
							new Error(
								`Server responded with status code ${response.statusCode} when downloading the file!`
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
		LoggerHelper.appPrefix.success('Download complete. Extracting...')
		
		ZipHelper.extractSpecificDirectory(
			tarballDownloadBuffer,
			new UnifiedPath('./'),
			getPlatformSpecificBinaryDirectoryPath(platform)
		)
		LoggerHelper.appPrefix.success('Installation complete.')
	}

	static isPlatformSpecificPackageInstalled(platform: SupportedPlatforms) {
		return fs.existsSync(getPlatformSpecificBinaryPath(platform).toPlatformString())
	}

	static async installPlatformSpecificPackage(platform: SupportedPlatforms) {
		const platformSpecificPackageName = getPlatformSpecificPackageName(platform)

		if (!platformSpecificPackageName) {
			throw new Error('Platform not supported!')
		}

		// Skip downloading the binary if it was already installed via optionalDependencies
		if (!InstallHelper.isPlatformSpecificPackageInstalled(platform)) {
			LoggerHelper.appPrefix.log('Energy measurement binary not found.')
			LoggerHelper.appPrefix.log(`Downloading required binary for ${platform}...`)
			await InstallHelper.downloadPlatformSpecificBinary(platform)
		}
	}
}