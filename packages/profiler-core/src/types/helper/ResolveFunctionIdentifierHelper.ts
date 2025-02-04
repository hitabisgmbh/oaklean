import { SourceNodeIdentifier_string } from '../SourceNodeIdentifiers'
import { UnifiedPath } from '../../system/UnifiedPath'

export type ResolvedSourceNodeLocation = {
	relativeFilePath: UnifiedPath,
	functionIdentifier: SourceNodeIdentifier_string
}