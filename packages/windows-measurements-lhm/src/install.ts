import {
	InstallHelper
} from './helper/InstallHelper'

if (process.platform === 'win32') {
	InstallHelper.installPlatformSpecificPackage(process.platform)
} else {
	console.log('@oaklean/windows-measurements-lhm: This package is only for Windows')
}