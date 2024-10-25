import * as fs from 'fs'

import AdmZip from 'adm-zip'
import { UnifiedPath } from '@oaklean/profiler-core'

export class ZipHelper {
	static extractSpecificDirectory(
		zipBuffer: Buffer, // Buffer containing the ZIP file
		targetDirectory: UnifiedPath, // Directory to extract from the ZIP file
		outputDir: UnifiedPath // Output directory
	): void {
		// Load the ZIP file
		const zip = new AdmZip(zipBuffer)

		// Get the list of all entries (files/directories) in the ZIP file
		const zipEntries = zip.getEntries()

		// Create the output directory if it doesn't exist
		if (!fs.existsSync(outputDir.toPlatformString())) {
			fs.mkdirSync(outputDir.toPlatformString(), { recursive: true })
		}

		// Filter files that belong to the target directory
		zipEntries.forEach(entry => {
			// Normalize paths and check if the entry starts with the target directory path
			const entryPath = new UnifiedPath(entry.entryName).toString()
			const shouldExtract = entryPath.startsWith(targetDirectory.toString()) && !entry.isDirectory
			if (!shouldExtract) {
				return
			}

			const outputFilePath = outputDir.join(targetDirectory.pathTo(entryPath))
			const outputDirPathString = outputFilePath.dirName().toPlatformString()
			if (!fs.existsSync(outputDirPathString)) {
				fs.mkdirSync(outputDirPathString, { recursive: true })
			}

			const outputFilePathString = outputFilePath.toPlatformString()
			// Write the file
			fs.writeFileSync(outputFilePathString, entry.getData())
		})
	}
}