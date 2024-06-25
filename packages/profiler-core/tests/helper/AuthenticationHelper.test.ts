import * as fs from 'fs'
import os from 'os'

import { AuthenticationHelper, STATIC_GLOBAL_CONFIG_DIR } from '../../src/helper/AuthenticationHelper'
import { UnifiedPath } from '../../src/system/UnifiedPath'

jest.mock('fs')

const EXAMPLE_AUTH_KEY = 'c7b3b435-bc17-48a4-bb36-b4fe7aabe046'

describe('AuthenticationHelper', () => {
	describe('getAuthentication', () => {
		it('should return the authentication key from the auth file if no env variable is specified', () => {
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
			expect(AuthenticationHelper.getAuthentication()).toBe(EXAMPLE_AUTH_KEY);

			(fs.existsSync as jest.Mock).mockReset();
			(fs.readFileSync as jest.Mock).mockReset()
		})

		it('should return the authentication key from the environment variable', () => {
			process.env.OAKLEAN_AUTH_KEY = EXAMPLE_AUTH_KEY
			expect(AuthenticationHelper.getAuthentication()).toBe(EXAMPLE_AUTH_KEY)	
			process.env.OAKLEAN_AUTH_KEY = undefined
		})
	})
})