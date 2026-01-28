import ReportCommands from '../../src/commands/ReportCommands'

describe('ReportCommands', () => {
	const reportCommands = ReportCommands.init()

	it('should create an instance of ReportCommands', () => {
		expect(reportCommands).toBeInstanceOf(ReportCommands)
	})

	it('should have a check method', () => {
		expect(reportCommands.check).toBeDefined()
	})

	it('should have a convertToJSON method', () => {
		expect(reportCommands.convertToJSON).toBeDefined()
	})

	it('should have a convertToSourceFileMetaDataTreeTree method', () => {
		expect(reportCommands.convertToSourceFileMetaDataTreeTree).toBeDefined()
	})

	it('should have a inspect method', () => {
		expect(reportCommands.inspect).toBeDefined()
	})

	it('should have a toHash method', () => {
		expect(reportCommands.toHash).toBeDefined()
	})
})
