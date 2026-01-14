import MetricsDataCommands from '../../src/commands/MetricsDataCommands'

describe('MetricsDataCommands', () => {
	const metricsDataCommands = MetricsDataCommands.init()

	it('should create an instance of MetricsDataCommands', () => {
		expect(metricsDataCommands).toBeInstanceOf(MetricsDataCommands)
	})

	it('should have a show method', () => {
		expect(metricsDataCommands.show).toBeDefined()
	})
})