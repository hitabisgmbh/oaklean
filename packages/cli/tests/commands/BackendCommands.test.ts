import BackendCommands from '../../src/commands/BackendCommands'

describe('BackendCommands', () => {
	const backendCommands = BackendCommands.init()

	it('should create an instance of BackendCommands', () => {
		expect(backendCommands).toBeInstanceOf(BackendCommands)
	})

	it('should have a sendReportToBackend method', () => {
		expect(backendCommands.sendReportToBackend).toBeDefined()
	})
})
