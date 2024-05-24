import { UnifiedPath } from '../../../src/system/UnifiedPath'
import { BaseAdapter } from '../../../src/adapters/transformer/BaseAdapter'

class SubClass extends BaseAdapter {

}

describe('BaseAdapter', () => {
	let instance: SubClass

	beforeEach(() => {
		instance = new SubClass()
	})

	it('instance should be an instanceof BaseAdapter', () => {
		expect(instance instanceof BaseAdapter).toBeTruthy()
	})

	it('should have a method process()', async () => {
		expect(instance.process).toBeTruthy()
	})

	it('should an error if BaseAdapter.process is not implemented', () => {
		const t = async () => {
			await instance.process(new UnifiedPath('./test'))
		}
		expect(t).rejects.toThrowError('BaseAdapter.process: must be implemented')
	})
})