import type { Protocol as Cdp } from 'devtools-protocol'

export class CPUProfilerCleanUpHelper {
	// Method to fix accumulated errors in cpu profiles caused by negative timeDelta
	// https://github.com/jlfwong/speedscope/blob/main/src/import/chrome.ts
	// https://github.com/jlfwong/speedscope/pull/305
	static cleanUpProfile(profile: Cdp.Profiler.Profile) {
		if (profile.samples === undefined || profile.timeDeltas === undefined) {
			throw new Error('NodeInspectorProfiler.cleanUpProfile: profile format is not complete')
		}
		const sampleTimes: number[] = []

		// The first delta is relative to the profile startTime.
		// Ref: https://github.com/v8/v8/blob/44bd8fd7/src/inspector/js_protocol.json#L1485
		let elapsed = profile.timeDeltas[0]

		// Prevents negative time deltas from causing bad data. See
		// https://github.com/jlfwong/speedscope/pull/305 for details.
		let lastValidElapsed = elapsed

		// The chrome CPU profile format doesn't collapse identical samples. We'll do that
		// here to save a ton of work later doing mergers.
		for (let i = 0; i < profile.samples.length; i++) {
			if (elapsed < lastValidElapsed) {
				sampleTimes.push(lastValidElapsed)
			} else {
				sampleTimes.push(elapsed)
				lastValidElapsed = elapsed
			}

			if (i === profile.samples.length - 1) {
				if (elapsed < lastValidElapsed) {
					sampleTimes.push(lastValidElapsed)
				} else {
					sampleTimes.push(elapsed)
					lastValidElapsed = elapsed
				}
			} else {
				const timeDelta = profile.timeDeltas[i + 1]
				elapsed += timeDelta
			}
		}

		let latest = sampleTimes[0]
		const timeDeltas = [latest]

		for (let i = 1; i < sampleTimes.length - 1; i++) {
			const delta = sampleTimes[i] - latest
			timeDeltas.push(delta)
			latest = sampleTimes[i]
		}

		profile.timeDeltas = timeDeltas

		for (const node of profile.nodes) {
			// node:inspector returns 0-based line and column numbers
			// the previously used v8-profiler-next used 1-based line and column numbers
			node.callFrame.lineNumber += 1 // convert to 1-based line number
			node.callFrame.columnNumber += 1 // convert to 1-based column number
		}
	}
}
