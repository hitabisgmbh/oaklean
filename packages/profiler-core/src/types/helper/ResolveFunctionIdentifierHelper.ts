import { SourceNodeIdentifier_string } from '../SourceNodeIdentifiers'
import { UnifiedPath } from '../../system/UnifiedPath'

export type ResolvedSourceNodeLocation = {
	// relative to project root or module root (depending on scope)
	relativeFilePath: UnifiedPath,
	functionIdentifier: SourceNodeIdentifier_string
}