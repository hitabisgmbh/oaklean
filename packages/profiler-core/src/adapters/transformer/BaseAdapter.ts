import { UnifiedPath } from '../../system/UnifiedPath'

export abstract class BaseAdapter {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async process(filePath: UnifiedPath): Promise<string> {
		throw new Error('BaseAdapter.process: must be implemented')
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async shouldProcess(filePath: UnifiedPath): Promise<boolean> {
		throw new Error('BaseAdapter.shouldProcess: must be implemented')
	}
}