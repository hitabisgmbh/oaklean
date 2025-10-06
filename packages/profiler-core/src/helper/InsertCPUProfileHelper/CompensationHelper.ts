import { State } from './types/state'
import { TransitionResult } from './types/transition'

import { SensorValues } from '../../model/SensorValues'

export class CompensationHelper {
	static createCompensationIfNecessary(
		currentState: State,
		transitionResult: TransitionResult
	) {
		if (
			// its not a stayInState transition
			transitionResult.accountingInfo !== null &&
			// no link was created
			transitionResult.accountingInfo.accountedSourceNodeReference === null &&
			// special case: lang_internal nodes never create links
			currentState.type !== 'lang_internal'
		) {
			// if no link is created, we treat this as a special case
			// this call is treated as if the call tree starts here
			//
			// since the current node was accounted with the full aggregated sensor values
			// without a reference being created, the current nodes sensor values do not add up
			// we need to compensate the accounted sensor values here
			// and in all its parents
			// so the compensation needs to be carried upwards
			transitionResult.compensation = new SensorValues(
				transitionResult.accountingInfo.accountedSensorValues
			)
		}
	}

	static compensate() {}
}
