import * as fs from 'fs'

import { UnifiedPath } from '../system/UnifiedPath'
import { PathUtils } from '../helper/PathUtils'

const packageJsonPath = PathUtils.findUp('package.json', __dirname)
if (!packageJsonPath) {
	throw new Error('Module cannot access its own package.json')
}

const package_version = JSON.parse(fs.readFileSync(
	new UnifiedPath(packageJsonPath).toString()
	, 'utf-8')).version

export const VERSION = package_version === '0.0.0' ? '0.1.5' : package_version

export const APP_NAME = 'Oaklean'