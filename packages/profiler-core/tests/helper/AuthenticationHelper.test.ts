import * as fs from 'fs'
import os from 'os'

import {
	STATIC_GLOBAL_CONFIG_DIR
} from '../../src/constants/config'
import * as env from '../../src/constants/env'
import { AuthenticationHelper } from '../../src/helper/AuthenticationHelper'
import { UnifiedPath } from '../../src/system/UnifiedPath'

const EXAMPLE_AUTH_KEY = 'c7b3b435-bc17-48a4-bb36-b4fe7aabe046'

jest.mock('fs')
jest.mock('../../src/constants/env')

describe('AuthenticationHelper', () => {
	describe('getAuthentication', () => {
		it('should return the authentication key from the auth file if no env variable is specified', async () => {
			const configDir = new UnifiedPath(os.homedir()).join(STATIC_GLOBAL_CONFIG_DIR)
			const authFile = configDir.join('auth');
			
			(fs.existsSync as jest.Mock).mockImplementation((path: fs.PathLike) => {
				if (path === configDir.toPlatformString() || path === authFile.toPlatformString()) {
					return true
				}
				return fs.existsSync(path)
			});
			(fs.readFileSync as jest.Mock).mockImplementation((path: fs.PathOrFileDescriptor) => {
				if (path === authFile.toPlatformString()) {
					return EXAMPLE_AUTH_KEY
				}
				return fs.readFileSync(path)
			})
			expect(await AuthenticationHelper.getAuthentication()).toBe(EXAMPLE_AUTH_KEY);

			(fs.existsSync as jest.Mock).mockRestore();
			(fs.readFileSync as jest.Mock).mockRestore()
		})

		it('should return the authentication key from the environment variable', async () => {
			const mockedEnv = jest.mocked(env)
			const originalAuthKey = mockedEnv.OAKLEAN_AUTH_KEY
			mockedEnv.OAKLEAN_AUTH_KEY = EXAMPLE_AUTH_KEY
			expect(await AuthenticationHelper.getAuthentication()).toBe(EXAMPLE_AUTH_KEY)	
			mockedEnv.OAKLEAN_AUTH_KEY = originalAuthKey
		})
	})
})