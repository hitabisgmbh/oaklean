/**
 * Memoizes a function by caching its results for future invocations with the same arguments.
 * @param func The function to memoize.
 * @returns A memoized version of the function.
 *
 * Example usage:
 *
 * function expensiveOperation(n: number): number {
 *   console.log('Computing...');
 *   return n * 2;
 * }
 *
 * const memoizedOperation = memoize(expensiveOperation);
 *
 * console.log(memoizedOperation(5)); // Computing... 10
 * console.log(memoizedOperation(5)); // 10 (cached)
 * console.log(memoizedOperation(6)); // Computing... 12
 * console.log(memoizedOperation(6)); // 12 (cached)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(func: T): T {
	const cache = new Map()

	return ((...args: Parameters<T>) => {
		const key = JSON.stringify(args)

		if (cache.has(key)) {
			return cache.get(key)
		}

		const result = func(...args)
		cache.set(key, result)

		return result
	}) as T
}
