import inspector from 'node:inspector'

export class InspectorSessionHelper {
	private static _session = new inspector.Session()
	private static _connected = false
	private static _destroyed = false

	/*
	 * Connects the inspector session.
	*/
	static connect() {
		if (InspectorSessionHelper._destroyed) {
			throw new Error('Inspector session has been destroyed')
		}
		if (InspectorSessionHelper._connected) {
			return
		}
		InspectorSessionHelper._session.connect()
		InspectorSessionHelper._connected = true
	}

	/**
	 * Disconnects the inspector session.
	 */
	static disconnect() {
		if (InspectorSessionHelper._destroyed) {
			throw new Error('Inspector session has been destroyed')
		}
		if (!InspectorSessionHelper._connected){
			return
		}

		InspectorSessionHelper._session.disconnect()
		InspectorSessionHelper._connected = false
		InspectorSessionHelper._destroyed = true
	}

	/**
	 * Returns whether the inspector session is connected.
	 */
	static get connected() {
		return InspectorSessionHelper._connected
	}

	/**
	 * Returns whether the inspector session is destroyed.
	 */
	static get destroyed() {
		return InspectorSessionHelper._destroyed
	}

	/**
	 * Returns the singleton inspector session, connecting it if necessary.
	 */
	static get session() {
		if (InspectorSessionHelper._destroyed) {
			throw new Error('Inspector session has been destroyed')
		}

		if (!InspectorSessionHelper._connected) {
			InspectorSessionHelper.connect()
		}
		return InspectorSessionHelper._session
	}
}
