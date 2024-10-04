import {
	InstallHelper
} from './helper/InstallHelper'

if (process.platform !== 'win32') {
	throw new Error('This module is only intended for Windows platforms')
}
InstallHelper.installPlatformSpecificPackage(process.platform)
