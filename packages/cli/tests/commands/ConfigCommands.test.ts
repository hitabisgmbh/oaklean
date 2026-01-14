import ConfigCommands from '../../src/commands/ConfigCommands'

describe('ConfigCommands', () => {
	const configCommands = ConfigCommands.init()

	it('should create an instance of ConfigCommands', () => {
		expect(configCommands).toBeInstanceOf(ConfigCommands)
	})

	it('should have a resolve method', () => {
		expect(configCommands.resolve).toBeDefined()
	})
})