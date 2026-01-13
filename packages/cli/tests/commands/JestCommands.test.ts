import JestCommands from '../../src/commands/JestCommands'

describe('JestCommands', () => {
	const jestCommands = JestCommands.init()

	it('should create an instance of JestCommands', () => {
		expect(jestCommands).toBeInstanceOf(JestCommands)
	})

	it('should have a inspectCPUProfiles method', () => {
		expect(jestCommands.inspectCPUProfiles).toBeDefined()
	})

	it('should have a verify method', () => {
		expect(jestCommands.verify).toBeDefined()
	})

	it('should have a verifyTrees method', () => {
		expect(jestCommands.verifyTrees).toBeDefined()
	})
})