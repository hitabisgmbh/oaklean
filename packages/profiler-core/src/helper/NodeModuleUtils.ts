import { UnifiedPath } from '../system/UnifiedPath'
import { UnifiedPathPart_string } from '../types/UnifiedPath.types'

export class NodeModuleUtils {
	static getParentModuleFromPath(path: UnifiedPath): UnifiedPath | undefined {
		const pathToNodeModules = path.pathUntilSubDir('node_modules' as UnifiedPathPart_string)
		if (!pathToNodeModules) {
			// not part a module
			return undefined
		}
		// is part of a module
		const { match, remainder } = pathToNodeModules

		if (remainder.toString().startsWith('./@')) {
			// scoped package
			return match.join(remainder.split()[0], remainder.split()[1])
		}
		return match.join(remainder.split()[0])
	}
}