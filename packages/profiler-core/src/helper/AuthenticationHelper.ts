import os from 'os'
import fs from 'fs'

import { PermissionHelper } from './PermissionHelper'

import {
	OAKLEAN_AUTH_KEY,
	STATIC_GLOBAL_CONFIG_DIR
} from '../constants'
import { UnifiedPath } from '../system/UnifiedPath'
import { Crypto } from '../system/Crypto'
// Types
import {
	UUID_string,
	PermissionTypes
} from '../types'

export class AuthenticationHelper {
	static getAuthentication(): UUID_string {
		if (OAKLEAN_AUTH_KEY !== undefined) {
			if (!Crypto.validateUniqueID(OAKLEAN_AUTH_KEY as UUID_string)) {
				throw new Error('AuthenticationHelper.getAuthentication: Env Variable OAKLEAN_AUTH_KEY is no uuid4')
			}
			return OAKLEAN_AUTH_KEY as UUID_string
		}

		const configDir = new UnifiedPath(os.homedir()).join(STATIC_GLOBAL_CONFIG_DIR)
		const authFile = configDir.join('auth')

		if (!fs.existsSync(configDir.toPlatformString())) {
			PermissionHelper.mkdirRecursivelyWithUserPermission(configDir)
		}

		if (!fs.existsSync(authFile.toPlatformString())) {
			const auth = Crypto.uniqueID()
			PermissionHelper.writeFileWithUserPermission(authFile.toPlatformString(), auth)
			PermissionHelper.changeFilePermission(authFile.toPlatformString(), PermissionTypes.ReadWriteOnlyOwner)
			return auth as unknown as UUID_string
		} else {
			const auth = fs.readFileSync(authFile.toPlatformString()).toString() as UUID_string
			if (!Crypto.validateUniqueID(auth)) {
				throw new Error('AuthenticationHelper.getAuthentication: authentication string is no uuid4')
			}
			return auth
		}
	}
}