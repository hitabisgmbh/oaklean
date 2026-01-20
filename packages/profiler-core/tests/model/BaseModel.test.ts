import { BaseModel } from '../../src/model/BaseModel'

type ISubClass = {
	records: Record<string, ISubClass>
}

class SubClass extends BaseModel {
	records: Record<string, SubClass>

	constructor() {
		super()
		this.records = {}
	}

	toJSON(): ISubClass {
		return {
			records: BaseModel.recordToJSON<ISubClass>(this.records)
		}
	}
}

describe('BaseModel', () => {
	describe('instance related', () => {
		let instance: SubClass

		beforeEach(() => {
			instance = new SubClass()
			const child1 = new SubClass()
			const child2 = new SubClass()
			instance.records = {
				child1: child1,
				child2: child2
			}
		})

		it('instance should be an instanceof BaseModel', () => {
			expect(instance instanceof BaseModel).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SubClass.fromJSON).toBeTruthy()
			expect(
				SubClass.fromJSON({
					records: {
						child1: {
							records: {}
						},
						child2: {
							records: {}
						}
					}
				})
			).toEqual({})
		})

		it('should have a static method recordToJSON()', () => {
			expect(SubClass.recordToJSON).toBeTruthy()
			expect(
				SubClass.recordToJSON({
					child1: new SubClass()
				})
			).toEqual({
				child1: {
					records: {}
				}
			})
		})
	})
})
