import * as fs from 'fs'

import type { Protocol as Cdp } from 'devtools-protocol'

import { CPUProfileSourceLocation } from './CPUProfileSourceLocation'

import { UnifiedPath } from '../../system/UnifiedPath'
import { LoggerHelper } from '../LoggerHelper'
import { JSONHelper } from '../JSONHelper'

export class CPUProfileHelper {
	/**
	 * This function is used to convert all paths in the CPU profile to relative paths.
	 * (relative to the rootDir)
	 * 
	 * The CPU profile is then written to the given output path.
	 * This creates anonymized CPU profiles that can be shared with others
	 * while still preserving the structure of the profile
	 * so it can be used in the InsertCPUProfileHelper.insertCPUProfile function.
	 * 
	 * @param rootDir path to the root directory of the project
	 * 
	 * @param cpuProfilePath path to the CPU profile that should be anonymized
	 * @param outPath path to the output file
	 */
	static async anonymize(
		rootDir: UnifiedPath,
		cpuProfilePath: UnifiedPath,
		outPath: UnifiedPath,
	) {
		const cpuProfile = await CPUProfileHelper.loadFromFile(cpuProfilePath)

		if (cpuProfile === undefined) {
			LoggerHelper.error(
				`CPU profile could not be loaded from ${cpuProfilePath.toPlatformString()}. ` +
				'Please make sure the file exists and is a valid CPU profile.'
			)
			return
		}

		const nodes = cpuProfile.nodes as Cdp.Profiler.ProfileNode[]
		for (const node of nodes) {
			const location = new CPUProfileSourceLocation(
				rootDir,
				0,
				node.callFrame
			)
			if (!location.isLangInternal && !location.isWASM && !location.isEmpty) {
				node.callFrame.url = location.relativeUrl.toString()
			}
		}
		await CPUProfileHelper.storeToFile(
			cpuProfile,
			outPath
		)
	}

	static async loadFromFile(
		cpuProfilePath: UnifiedPath
	): Promise<Cdp.Profiler.Profile | undefined> {
		if (!fs.existsSync(cpuProfilePath.toPlatformString())) {
			return undefined
		}

		try {
			return await JSONHelper.loadBigJSON(cpuProfilePath)
		} catch (error) {
			LoggerHelper.error(
				`Error loading CPU profile from ${cpuProfilePath.toPlatformString()}: ${error}`
			)
			return undefined
		}
	}

	static async storeToFile(
		cpuProfile: Cdp.Profiler.Profile,
		cpuProfilePath: UnifiedPath
	): Promise<void> {
		await JSONHelper.storeBigJSON(
			cpuProfilePath,
			cpuProfile
		)
	}
}