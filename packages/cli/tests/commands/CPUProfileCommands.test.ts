import CPUProfileCommands from '../../src/commands/CPUProfileCommands'

describe('CPUProfileCommands', () => {
	const cpuProfileCommands = CPUProfileCommands.init()

	it('should create an instance of CPUProfileCommands', () => {
		expect(cpuProfileCommands).toBeInstanceOf(CPUProfileCommands)
	})

	it('should have a anonymize method', () => {
		expect(cpuProfileCommands.anonymize).toBeDefined()
	})

	it('should have a convertToCPUModel method', () => {
		expect(cpuProfileCommands.convertToCPUModel).toBeDefined()
	})

	it('should have a inspect method', () => {
		expect(cpuProfileCommands.inspect).toBeDefined()
	})

	it('should have a trace method', () => {
		expect(cpuProfileCommands.trace).toBeDefined()
	})
})