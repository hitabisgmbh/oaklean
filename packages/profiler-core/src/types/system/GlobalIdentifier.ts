import { UnifiedPath_string } from './UnifiedPath'

import {
	LangInternalPath_string,
	SourceNodeIdentifier_string
} from '../SourceNodeIdentifiers'
import { INodeModule } from '../model/NodeModule'

export interface IGlobalIdentifier {
	nodeModule?: INodeModule
	path: UnifiedPath_string | LangInternalPath_string
	sourceNodeIdentifier: SourceNodeIdentifier_string
}
