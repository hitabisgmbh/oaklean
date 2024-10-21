export class SetHelper {
	static intersect<T>(set1: Set<T>, set2: Set<T>): Set<T> {
		const ans = new Set<T>()
		for (const i of set2) {
			if (set1.has(i)) {
				ans.add(i)
			}
		}
		return ans
	}

	static union<T>(...sets: Set<T>[]): Set<T> {
		return new Set<T>(sets.flatMap(set => [...set]))
	}
}
