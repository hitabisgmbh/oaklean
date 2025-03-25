import axios from 'axios'
import FormData from 'form-data'

import { BufferHelper } from './BufferHelper'
import { AuthenticationHelper } from './AuthenticationHelper'

import {
	ProfilerConfig,
	ProjectReport
} from '../model'

export class RegistryHelper {
	static async uploadToRegistry(
		projectReport: ProjectReport,
		config?: ProfilerConfig
	) {
		const usedConfig = config !== undefined ? config : ProfilerConfig.autoResolve()

		if (!usedConfig.uploadEnabled()) {
			return
		}

		const compressedBuffer = await BufferHelper.compressBuffer(projectReport.toBuffer())

		const formData = new FormData()
		formData.append('file', compressedBuffer, 'filename.txt')
		formData.append('auth', AuthenticationHelper.getAuthentication())

		try {
			const result = await axios.post(usedConfig.getRegistryUploadUrl(), formData, {
				timeout: 5000, // Set a timeout of 5 seconds
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			return result	
		} catch {}
	}
}