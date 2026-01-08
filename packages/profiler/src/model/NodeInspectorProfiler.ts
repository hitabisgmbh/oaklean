import type { Protocol as Cdp } from 'devtools-protocol'
import {
	MicroSeconds_number,
	InspectorSessionHelper
} from '@oaklean/profiler-core'

import {
	CPUProfilerCleanUpHelper
} from '../helper/CPUProfileCleanUpHelper'

export class NodeInspectorProfiler {
	static async startProfiling(): Promise<void> {
		return new Promise((resolve, reject) => {
			InspectorSessionHelper.session.post('Profiler.enable', (err: Error | null) => {
				if (err) {
					return reject(err)
				}
				InspectorSessionHelper.session.post('Profiler.start', (err: Error | null) => {
					if (err) {
						return reject(err)
					}
					resolve()
				})
			})
		})
	}

	static async stopProfiling(): Promise<Cdp.Profiler.Profile> {
		return new Promise((resolve, reject) => {
			InspectorSessionHelper.session.post('Profiler.stop', (err, result) => {
				if (err) {
					reject(err)
				}
				CPUProfilerCleanUpHelper.cleanUpProfile(result.profile)
				resolve(result.profile)
			})
		})
	}

	static async setSamplingInterval(num: MicroSeconds_number): Promise<void> {
		return new Promise((resolve, reject) => {
			InspectorSessionHelper.session.post('Profiler.setSamplingInterval', { interval: num }, (err) => {
				if (err) {
					return reject(err)
				}
				resolve()
			})
		})
	}
}
