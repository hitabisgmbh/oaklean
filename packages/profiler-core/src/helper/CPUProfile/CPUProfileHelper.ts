import * as fs from 'fs'

import type { Protocol as Cdp } from 'devtools-protocol'

import { CPUProfileSourceLocation } from './CPUProfileSourceLocation'

import { UnifiedPath } from '../../system/UnifiedPath'
import { PermissionHelper } from '../PermissionHelper'

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
		const cpuProfile = JSON.parse(
			fs.readFileSync(cpuProfilePath.toPlatformString(), 'utf-8').toString()
		)

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
		PermissionHelper.writeFileWithUserPermission(
			outPath.toPlatformString(),
			JSON.stringify(cpuProfile, null, 2),
		)
	}
}