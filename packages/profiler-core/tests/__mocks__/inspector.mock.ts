import * as fs from 'fs'
import inspector from 'inspector'

export const SCRIPT_SOURCES: Record<string, string> = {
	'1': fs.readFileSync(__dirname + '/script01.js').toString(),
	'2': fs.readFileSync(__dirname + '/script02.js').toString(),
	'3': fs.readFileSync(__dirname + '/script03.js').toString(),
}

type SessionPostMessage = 'Debugger.enable' | 'Debugger.disable' | 'Debugger.getScriptSource'

type SessionPostCallbackType = {
	'Debugger.enable': (err: Error | null, params: inspector.Debugger.EnableReturnType) => void
	'Debugger.disable': (err: Error | null) => void
	'Debugger.getScriptSource': (err: Error | null, params: inspector.Debugger.GetScriptSourceReturnType) => void
}

class Session {
	connected: boolean
	debuggerEnabled: boolean

	constructor() {
		this.connected = false
		this.debuggerEnabled = false
	}

	connect () {
		this.connected = true
	}
	disconnect () {
		this.connected = false
	}
	async on(eventName: 'inspectorNotification', listener: (message: inspector.InspectorNotification<object>) => void) {
		if (!this.connected) {
			throw new Error('Session is not connected')
		}
		if (eventName === 'inspectorNotification') {
			await listener({
				method: 'Debugger.scriptParsed',
				params: {
					url: 'file:///script1.js',
					scriptId: '1'
				}
			})
			await listener({
				method: 'Debugger.scriptParsed',
				params: {
					url: 'file:///script2.js',
					scriptId: '2'
				}
			})
			await listener({
				method: 'Debugger.scriptParsed',
				params: {
					url: 'file:///script3.js',
					scriptId: '3'
				}
			})
		}
	}
	post<T extends SessionPostMessage>(message: T, args2?: any, args3?: any) {
		if (!this.connected) {
			throw new Error('Session is not connected')
		}
		let callback: SessionPostCallbackType[T] | undefined
		let params: inspector.Debugger.GetScriptSourceParameterType | undefined
		if (message === 'Debugger.getScriptSource') {
			callback = args3
			params = args2
		} else {
			callback = args2
		}
		switch (message) {
			case 'Debugger.enable':
				this.debuggerEnabled = true
				if (callback) {
					(callback as SessionPostCallbackType['Debugger.enable'])(null, {
						debuggerId: '1'
					})
				}
				break
			case 'Debugger.disable':
				this.debuggerEnabled = false
				if (callback) {
					(callback as SessionPostCallbackType['Debugger.disable'])(null)
				}
				break
			case 'Debugger.getScriptSource':
				if (callback && this.debuggerEnabled && params) {
					(callback as SessionPostCallbackType['Debugger.getScriptSource'])(null, {
						scriptSource: SCRIPT_SOURCES[params.scriptId]
					})
				}
				break
			default:
				throw new Error('Mock not implemented')
		}
	}
}

jest.mock('inspector', () => {
	return {
		Session
	}
})