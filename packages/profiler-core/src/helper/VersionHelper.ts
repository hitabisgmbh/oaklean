export class VersionHelper {
	/**
	 * Compare two version strings.
	 *
	 * @param version - The version to compare.
	 * @param to - The version to compare to.
	 * @returns The comparison
	 * 	- 1 if version is greater than to
	 * 	- -1 if version is less than to
	 * 	- 0 if version is equal to to
	 **/
	static compare(version: string, to: string): number {
		const versionParts = version.split('.')
		const toParts = to.split('.')
		const length = Math.max(versionParts.length, toParts.length)
		for (let i = 0; i < length; i++) {
			const a = parseInt(versionParts[i] || '0', 10)
			const b = parseInt(toParts[i] || '0', 10)
			if (a > b) {
				return 1
			}
			if (a < b) {
				return -1
			}
		}
		return 0
	}
}
