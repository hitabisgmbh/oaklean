import { EventHandler } from '../../src/helper/EventHandler'

type EventMap = {
	event1: [string]
	event2: [number]
}

describe('EventHandler', () => {
	let instance: EventHandler<EventMap>

	beforeEach(() => {
		instance = new EventHandler()
	})

	test('should add event listener', () => {
		const listener = jest.fn()
		instance.on('event1', listener)
		instance.fire('event1', 'test')
		instance.fire('event1', 'test')
		expect(listener).toHaveBeenCalledWith('test')
		expect(listener).toHaveBeenCalledTimes(2)
		expect(instance.eventCount('event1')).toBe(2)
	})

	test('should add event listener only once', () => {
		const listener = jest.fn()
		instance.once('event1', listener)
		instance.fire('event1', 'test')
		instance.fire('event1', 'test')
		expect(listener).toHaveBeenCalledTimes(1)
	})

	test('waitForFirstEventCall should wait for first event call', async () => {
		const promiseResolved = jest.fn()
		instance.waitForFirstEventCall('event1').then(promiseResolved)
		await new Promise(process.nextTick)
		expect(promiseResolved).not.toHaveBeenCalled()
		instance.fire('event1', 'test')
		await new Promise(process.nextTick)
		expect(promiseResolved).toHaveBeenCalled()
		expect(instance.eventCount('event1')).toBe(1)

		// every other call should resolve immediately
		const secondPromiseResolved = jest.fn()
		instance.waitForFirstEventCall('event1').then(secondPromiseResolved)
		await new Promise(process.nextTick)
		expect(secondPromiseResolved).toHaveBeenCalled()
	})

	test('awaitEventCall should wait for every event call', async () => {
		const promiseResolved = jest.fn()
		instance.awaitEventCall('event1').then(promiseResolved)
		await new Promise(process.nextTick)
		expect(promiseResolved).not.toHaveBeenCalled()
		instance.fire('event1', 'test')
		await new Promise(process.nextTick)
		expect(promiseResolved).toHaveBeenCalled()

		// next await should also block
		const secondPromiseResolved = jest.fn()
		instance.awaitEventCall('event1').then(secondPromiseResolved)
		await new Promise(process.nextTick)
		expect(secondPromiseResolved).not.toHaveBeenCalled()

		instance.fire('event1', 'test')
		await new Promise(process.nextTick)
		expect(promiseResolved).toHaveBeenCalled()
		expect(secondPromiseResolved).toHaveBeenCalledTimes(1)

		expect(instance.eventCount('event1')).toBe(2)
	})

	test('two events', () => {
		const listener1 = jest.fn()
		const listener2 = jest.fn()
		instance.on('event1', listener1)
		instance.on('event2', listener2)
		instance.fire('event1', 'test')
		instance.fire('event2', 42)
		expect(listener1).toHaveBeenCalledWith('test')
		expect(listener2).toHaveBeenCalledWith(42)
		expect(instance.eventCount('event1')).toBe(1)
		expect(instance.eventCount('event2')).toBe(1)
	})

	test('should remove event listener', () => {
		const listener = jest.fn()
		instance.on('event1', listener)
		instance.fire('event1', 'test')
		instance.removeListener('event1', listener)
		instance.fire('event1', 'test')
		expect(listener).toHaveBeenCalledTimes(1)
		expect(instance.eventCount('event1')).toBe(2)
	})

	test('multiple listeners', () => {
		const listener1 = jest.fn()
		const listener2 = jest.fn()
		instance.on('event1', listener1)
		instance.on('event1', listener2)
		instance.fire('event1', 'test')
		expect(listener1).toHaveBeenCalledWith('test')
		expect(listener2).toHaveBeenCalledWith('test')
		expect(instance.eventCount('event1')).toBe(1)
	})

	test('should remove all listeners', () => {
		const listener1 = jest.fn()
		const listener2 = jest.fn()
		const listener3 = jest.fn()
		instance.on('event1', listener1)
		instance.on('event1', listener2)
		instance.on('event2', listener3)
		instance.fire('event1', 'test')
		instance.fire('event2', 42)
		instance.removeAllListeners('event1')
		instance.fire('event1', 'test')
		instance.fire('event2', 42)
		expect(listener1).toHaveBeenCalledTimes(1)
		expect(listener2).toHaveBeenCalledTimes(1)
		expect(listener3).toHaveBeenCalledTimes(2)
		expect(instance.eventCount('event1')).toBe(2)
		expect(instance.eventCount('event2')).toBe(2)
	})
})
