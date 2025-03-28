import { CallIdentifier } from './CallIdentifier'

export class CallRelationTracker {
	private _map: Map<string, string[]>
	private _internMap: Map<string, boolean>
	private _externMap: Map<string, boolean>
	private _langInternalMap: Map<string, boolean>

	constructor() {
		this._map = new Map<string, string[]>()
		this._internMap = new Map<string, boolean>()
		this._externMap = new Map<string, boolean>()
		this._langInternalMap = new Map<string, boolean>()
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
		const childCalls = this._map.get(callIdentifier.toString())
		if (childCalls === undefined) {
			return false
		}
		childCalls.pop() // remove last child from parent
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
	 * Checks if a function call has child calls recorded (used in recursion tracking).
	 * 
	 * @param {CallIdentifier} callIdentifier - The call identifier
	 * @returns {boolean} true if the call has child calls recorded, false otherwise
	 */
	hasChildrenRecorded(callIdentifier: CallIdentifier) {
		return (this._map.get(callIdentifier.toString())?.length || 0) >0
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
			this._map.set(callIdentifierString, [])
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

		let previousChildCalls = this._map.get(parentCallIdentifierString)
		let alreadyLinked = false
		if (previousChildCalls === undefined) {
			previousChildCalls = []
			this._map.set(parentCallIdentifierString, previousChildCalls)
		} else {
			alreadyLinked = previousChildCalls.includes(selfCallIdentifierString)
		}
		previousChildCalls.push(selfCallIdentifierString)
		return alreadyLinked
	}
}