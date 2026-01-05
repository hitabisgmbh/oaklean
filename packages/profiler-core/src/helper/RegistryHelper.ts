import axios from 'axios'

import { BufferHelper } from './BufferHelper'
import { AuthenticationHelper } from './AuthenticationHelper'

import { OAKLEAN_DISABLE_REGISTRY } from '../constants'
import {
	ProfilerConfig,
	ProjectReport
} from '../model'

export class RegistryHelper {
	static async uploadToRegistry(
		projectReport: ProjectReport,
		config?: ProfilerConfig
	) {
		if (OAKLEAN_DISABLE_REGISTRY) {
			return
		}

		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		if (!usedConfig.uploadEnabled()) {
			return
		}

		const compressedBuffer = await BufferHelper.compressBuffer(projectReport.toBuffer())

		const formData = new FormData()
		formData.append('file', new Blob([new Uint8Array(compressedBuffer)]), 'filename.txt')
		formData.append('auth', await AuthenticationHelper.getAuthentication())

		try {
			const result = await axios.post(usedConfig.getRegistryUploadUrl(), formData, {
				timeout: 5000, // Set a timeout of 5 seconds
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			return result
		} catch {
			// do nothing
		}
	}
}