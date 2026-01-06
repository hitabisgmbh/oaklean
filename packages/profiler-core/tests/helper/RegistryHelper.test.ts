import * as fs from 'fs'

import axios from 'axios'

import * as env from '../../src/constants/env'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { ProjectReport } from '../../src/model/ProjectReport'
import { ProfilerConfig} from '../../src/model/ProfilerConfig'
import { RegistryHelper } from '../../src/helper/RegistryHelper'
import { AuthenticationHelper } from '../../src/helper/AuthenticationHelper'
import { BufferHelper } from '../../src/helper/BufferHelper'
// Types
import { UUID_string } from '../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)
const EXAMPLE_PROJECT_REPORT_BUFFER = Buffer.from(
	fs.readFileSync(CURRENT_DIR.join('..', 'model', 'assets', 'ProjectReport', 'instance.buffer').toString()).toString(),
	'hex'
)
const EXAMPLE_PROJECT_REPORT = ProjectReport.consumeFromBuffer(EXAMPLE_PROJECT_REPORT_BUFFER).instance

const MOCKED_ENV = jest.mocked(env)

describe('RegistryHelper', () => {
	describe('uploadToRegistry', () => {
		beforeEach(() => {
			jest.restoreAllMocks()
			MOCKED_ENV.OAKLEAN_DISABLE_REGISTRY = false
		})

		test('default behaviour', async () => {
			const exampleAuthKey = '12345678-0000-0000-0000-000000000000' as UUID_string

			const axiosPostMock = jest.fn().mockResolvedValue({ data: 'data' })
			const axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(axiosPostMock)
			jest.spyOn(AuthenticationHelper,'getAuthentication').mockResolvedValue(exampleAuthKey)

			const expectedCompressedBuffer = await BufferHelper.compressBuffer(EXAMPLE_PROJECT_REPORT.toBuffer())

			const config = ProfilerConfig.getDefaultConfig()
			const result = await RegistryHelper.uploadToRegistry(
				EXAMPLE_PROJECT_REPORT,
				config
			)
			expect(result).toEqual({ data: 'data' })

			expect(axiosPostSpy).toHaveBeenCalledTimes(1)
			expect(axiosPostMock.mock.calls[0][0]).toBe(config.getRegistryUploadUrl())
			expect(axiosPostMock.mock.calls[0][1]).toBeInstanceOf(FormData)
			expect(Array.from((axiosPostMock.mock.calls[0][1] as FormData).keys()).length).toBe(2)
			const file = (axiosPostMock.mock.calls[0][1] as FormData).get('file')
			expect(file).toBeInstanceOf(File)

			expect(Buffer.from(await (file as Blob).arrayBuffer())).toEqual(
				expectedCompressedBuffer
			)
			expect((axiosPostMock.mock.calls[0][1] as FormData).get('auth')).toEqual(
				exampleAuthKey
			)
		})

		test('disabled registry', async () => {
			MOCKED_ENV.OAKLEAN_DISABLE_REGISTRY = true
			const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: 'data' })

			const result = await RegistryHelper.uploadToRegistry(EXAMPLE_PROJECT_REPORT)
			expect(result).toBeUndefined()
			expect(axiosPostSpy).not.toHaveBeenCalled()			
		})
	})
})