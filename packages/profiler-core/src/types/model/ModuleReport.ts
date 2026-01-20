import { IReport } from './Report'
import { INodeModule } from './NodeModule'

export interface IModuleReport extends IReport {
	nodeModule: INodeModule
}
