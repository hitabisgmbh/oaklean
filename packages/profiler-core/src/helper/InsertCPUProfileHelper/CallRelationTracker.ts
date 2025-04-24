import { CallIdentifier } from './CallIdentifier'

type MapEntry = {
	children: string[],
	linkCountToChild: Map<string, number>
}

export class CallRelationTracker {
	/**
	 * Tracks the relations between function calls.
	 * 
	 * _map - Maps a function call to its child calls.
	 * parentCallIdentifier -> {
	 * 	children: [childCallIdentifier1, childCallIdentifier2, ...],
	 * 	perChild: {
	 * 		childCallIdentifier1 -> number, // number of links between parent and child
	 * 		childCallIdentifier2 -> number,	// number of links between parent and child
	 * 		...
	 * }
	 */
	private _map: Map<string, MapEntry>
	private _internMap: Map<string, boolean>
	private _externMap: Map<string, boolean>
	private _langInternalMap: Map<string, boolean>

	constructor() {
		this._map = new Map<string, MapEntry>()
		this._internMap = new Map<string, boolean>()
		this._externMap = new Map<string, boolean>()
		this._langInternalMap = new Map<string, boolean>()
	}

	get map() {
		return this._map
	}

	/**
	 * Check if the tracker is empty
	 * 
	 * @returns {boolean} true if the tracker is empty, false otherwise
	 */
	isEmpty() {
		return this._map.size === 0 &&
			this._internMap.size === 0 &&
			this._externMap.size === 0 &&
			this._langInternalMap.size === 0
	}

	/**
	 * Check if the tracker is currently in a headless scope.
	 * Meaning that no intern or extern calls were made yet.
	 */
	currentlyInHeadlessScope() {
		return this._internMap.size === 0 && this._externMap.size === 0
	}

	/**
	 * Returns debug information about the tracker.
	 * 
	 * @returns {object} debug information about the tracker
	 */
	debugInfo() {
		return {
			mapSize: this._map.size,
			internMapSize: this._internMap.size,
			externMapSize: this._externMap.size,
			langInternalMapSize: this._langInternalMap.size
		}
	}

	/**
	 * Remove the last child record from a call.
	 * Is used to remove the last child from a parent call after the child has been traversed.
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the child was removed, false otherwise
	 */
	removeLastChildRecord(callIdentifier: CallIdentifier): boolean {
		const mapEntry = this._map.get(callIdentifier.toString())
		if (mapEntry === undefined || mapEntry.children.length === 0) {
			return false
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const lastChildIdentifier = mapEntry.children.pop()! // remove last child from parent
		const numberOfLinks = mapEntry.linkCountToChild.get(lastChildIdentifier) || 0
		if (numberOfLinks > 1) {
			// reduce the number of links between parent and child
			mapEntry.linkCountToChild.set(lastChildIdentifier, numberOfLinks - 1)
		} else {
			// no more links between parent and child, remove counter
			mapEntry.linkCountToChild.delete(lastChildIdentifier)
		}

		return true
	}

	/**
	 * Checks if a function call has child calls recorded (used in recursion tracking).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the call identifier was already visited, false otherwise
	 */
	isCallRecorded(callIdentifier: CallIdentifier) {
		return this._map.has(callIdentifier.toString())
	}

	/**
	 * Gives the amount of recorded child calls for a function call.
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {number} the number of child calls
	 */
	getNumberOfChildren(callIdentifier: CallIdentifier): number {
		const mapEntry = this._map.get(callIdentifier.toString())
		if (mapEntry === undefined) {
			return 0
		}
		return mapEntry.children.length
	}

	/**
	 * Gives the amount of recorded links between two function calls.
	 * 
	 * @param {CallIdentifier} parentCallIdentifier - the caller's call identifier
	 * @param {CallIdentifier} childCallIdentifier - the callee's call identifier  
	 * @returns {number} the number of links between the two calls
	 */
	getNumberOfLinksBetweenCalls(
		parentCallIdentifier: CallIdentifier,
		childCallIdentifier: CallIdentifier
	): number {
		const childCalls = this._map.get(parentCallIdentifier.toString())
		if (childCalls === undefined) {
			return 0
		}
		const childCallIdentifierString = childCallIdentifier.toString()
		const numberOfLinks = childCalls.linkCountToChild.get(childCallIdentifierString)
		if (numberOfLinks === undefined) {
			return 0
		}
		return numberOfLinks
	}

	/**
	 * Removes all references to a function call (for cleanup).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 */
	removeCallRecord(callIdentifier: CallIdentifier) {
		const callIdentifierString = callIdentifier.toString()
		this._internMap.delete(callIdentifierString)
		this._externMap.delete(callIdentifierString)
		this._langInternalMap.delete(callIdentifierString)
		this._map.delete(callIdentifierString)
	}

	/**
	 * Ensures that a function call entry exists in the tracker.
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @param {string} kind - The kind of the call (intern, extern, langInternal)
	 * @returns {boolean} true if the call was initialized, false if it was already present
	 */
	initializeCallNodeIfAbsent(
		callIdentifier: CallIdentifier,
		kind: 'intern' | 'extern' | 'langInternal'
	) {
		if (!this.isCallRecorded(callIdentifier)) {
			const callIdentifierString = callIdentifier.toString()
			this._map.set(callIdentifierString, 
				{
					children: [],
					linkCountToChild: new Map<string, number>()
				}
			)
			switch (kind) {
				case 'intern':
					this._internMap.set(callIdentifierString, true)
					break
				case 'extern':
					this._externMap.set(callIdentifierString, true)
					break
				case 'langInternal':
					this._langInternalMap.set(callIdentifierString, true)
					break
			}
			return true
		}
		return false
	}

	/**
	 * Registers a function call as a child of another call.
	 * 
	 * @param {CallIdentifier} self - The call identifier of the child call
	 * @param {CallIdentifier} parent - The call identifier of the parent call
	 * @returns wether the link already existed
	 */
	linkCallToParent(
		self: CallIdentifier,
		parent: CallIdentifier
	): boolean {
		const selfCallIdentifierString = self.toString()
		const parentCallIdentifierString = parent.toString()

		let previousEntry = this._map.get(parentCallIdentifierString)
		if (previousEntry === undefined) {
			previousEntry = {
				children: [],
				linkCountToChild: new Map<string, number>()
			}
			this._map.set(parentCallIdentifierString, previousEntry)
		}
		previousEntry.children.push(selfCallIdentifierString)
		const numberOfExistingLinks = previousEntry.linkCountToChild.get(selfCallIdentifierString) || 0
		previousEntry.linkCountToChild.set(selfCallIdentifierString, numberOfExistingLinks + 1)
		return numberOfExistingLinks > 0
	}
}