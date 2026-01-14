import EventEmitter from 'events'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap<T> = Record<keyof T, any[]>;
type IfEventMap<Events extends EventMap<Events>, True, False> = object extends Events ? False : True;
type Args<Events extends EventMap<Events>, EventName extends string | symbol> = IfEventMap<
	Events,
	EventName extends keyof Events ? Events[EventName]
			: EventName extends keyof EventEmitterEventMap ? EventEmitterEventMap[EventName]
			: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
	any[] // eslint-disable-line @typescript-eslint/no-explicit-any
>;
type EventNames<Events extends EventMap<Events>, EventName extends string | symbol> = IfEventMap<
	Events,
	EventName | (keyof Events & (string | symbol)) | keyof EventEmitterEventMap,
	string | symbol
>;
type Listener<Events extends EventMap<Events>, EventName extends string | symbol> = IfEventMap<
	Events,
	(
			...args: EventName extends keyof Events ? Events[EventName]
					: EventName extends keyof EventEmitterEventMap ? EventEmitterEventMap[EventName]
					: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
	) => void,
	(...args: any[]) => void // eslint-disable-line @typescript-eslint/no-explicit-any
>;

interface EventEmitterEventMap {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	newListener: [eventName: string | symbol, listener: (...args: any[]) => void];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	removeListener: [eventName: string | symbol, listener: (...args: any[]) => void];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventHandler<T extends EventMap<T> = any> {
	_eventEmitter: EventEmitter<T>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _eventCallCount: Map<EventNames<T, any>, number>

	constructor() {
		this._eventEmitter = new EventEmitter()
		this._eventCallCount = new Map()
	}

	eventCount<E extends string | symbol>(eventName: EventNames<T, E>): number {
		return this._eventCallCount.get(eventName) || 0
	}

	fire<E extends string | symbol>(eventName: EventNames<T, E>, ...args: Args<T, E>) {
		const currentCount = this._eventCallCount.get(eventName) || 0
		this._eventCallCount.set(eventName, currentCount + 1)
		this._eventEmitter.emit(eventName, ...args)
	}

	async waitForFirstEventCall<E extends string | symbol>(eventName: EventNames<T, E>): Promise<void> {
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

	async awaitEventCall<E extends string | symbol>(eventName: EventNames<T, E>) {
		return new Promise<void>((resolve) => {
			this.once(eventName, (() => {
				resolve()
			}) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
		})
	}

	removeListener<E extends string | symbol>(eventName: EventNames<T, E>, listener: Listener<T, E>) {
		return this._eventEmitter.removeListener(eventName, listener)
	}

	removeAllListeners<E extends string | symbol>(eventName: EventNames<T, E>) {
		return this._eventEmitter.removeAllListeners(eventName)
	}

	 on<E extends string | symbol>(eventName: EventNames<T, E>, listener: Listener<T, E>) {
		return this._eventEmitter.on(eventName, listener)
	}

	once<E extends string | symbol>(eventName: EventNames<T, E>, listener: Listener<T, E>) {
		return this._eventEmitter.once(eventName, listener)
	}
}
