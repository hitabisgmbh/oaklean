type Test = 'a' | 'b' | 'c'

type IParent = {
	total: string
}

class Parent {
	x: Test
	y: Test
	z: Test

	constructor(x: Test, y: Test, z: Test) {
		this.x = x
		this.y = y
		this.z = z
	}
}


class Child extends Parent {
	constructor(x: Test, y: Test, z: Test) {
		super(x, y, z)
	}

	toJSON(): IParent {
		return {
			total: (this.x as string) + (this.y as string) + (this.z as string)
		}
	}
}

test('child', () => {
	const child = new Child('a', 'b', 'c')
	expect(child.toJSON()).toEqual({
		total: 'abc'
	})
})


