import EventEmitter from 'events'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRest = [...args: any[]];
type Args<K, T> = T extends DefaultEventMap ? AnyRest : (
	K extends keyof T ? T[K] : never
);
type Key<K, T> = T extends DefaultEventMap ? string | symbol : K | keyof T;
type Listener<K, T, F> = T extends DefaultEventMap ? F : (
	K extends keyof T ? (
		T[K] extends unknown[] ? (...args: T[K]) => void : never
	)
		: never
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener1<K, T> = Listener<K, T, (...args: any[]) => void>;

export class EventHandler<T extends EventMap<T> = DefaultEventMap> {
	_eventEmitter: EventEmitter<T>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _eventCallCount: Map<Key<any, T>, number>

	constructor() {
		this._eventEmitter = new EventEmitter()
		this._eventCallCount = new Map()
	}

	eventCount<K>(eventName: Key<K, T>): number {
		return this._eventCallCount.get(eventName) || 0
	}

	fire<K>(eventName: Key<K, T>, ...args: Args<K, T>) {
		const currentCount = this._eventCallCount.get(eventName) || 0
		this._eventCallCount.set(eventName, currentCount + 1)
		this._eventEmitter.emit(eventName, ...args)
	}

	async waitForFirstEventCall<K>(eventName: Key<K, T>): Promise<void> {
		return new Promise((resolve) => {
			const callCount = this._eventCallCount.get(eventName)
			if (callCount !== undefined && callCount > 0) {
				resolve()
				return
			}

			this.once(eventName, (() => {
				resolve()
			}) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
		})
	}

	async awaitEventCall<K>(eventName: Key<K, T>) {
		return new Promise<void>((resolve) => {
			this.once(eventName, (() => {
				resolve()
			}) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
		})
	}

	removeListener<K>(eventName: Key<K, T>, listener: Listener1<K, T>) {
		return this._eventEmitter.removeListener(eventName, listener)
	}

	removeAllListeners(eventName?: Key<unknown, T>) {
		return this._eventEmitter.removeAllListeners(eventName)
	}

	on<K>(eventName: Key<K, T>, listener: Listener1<K, T>) {
		return this._eventEmitter.on(eventName, listener)
	}

	once<K>(eventName: Key<K, T>, listener: Listener1<K, T>) {
		return this._eventEmitter.once(eventName, listener)
	}
}
