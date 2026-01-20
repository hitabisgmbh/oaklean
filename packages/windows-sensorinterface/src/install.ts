import { LoggerHelper } from '@oaklean/profiler-core'

import { InstallHelper } from './helper/InstallHelper'

if (process.platform === 'win32') {
	InstallHelper.installPlatformSpecificPackage(process.platform)
} else {
	LoggerHelper.warn('@oaklean/windows-sensorinterface: This package is only for Windows')
}
