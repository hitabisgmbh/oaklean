"use strict";
class Parent {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
class Child extends Parent {
    constructor(x, y, z) {
        super(x, y, z);
    }
    toJSON() {
        return {
            total: this.x + this.y + this.z
        };
    }
}
test('child', () => {
    const child = new Child('a', 'b', 'c');
    expect(child.toJSON()).toEqual({
        total: 'abc'
    });
});
