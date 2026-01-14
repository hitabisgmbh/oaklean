import CodeParsingCommands from '../../src/commands/CodeParsingCommands'

describe('CodeParsingCommands', () => {
	const codeParsingCommands = CodeParsingCommands.init()

	it('should create an instance of CodeParsingCommands', () => {
		expect(codeParsingCommands).toBeInstanceOf(CodeParsingCommands)
	})

	it('should have a convertToProgramStructureTree method', () => {
		expect(codeParsingCommands.convertToProgramStructureTree).toBeDefined()
	})

	it('should have a extractFile method', () => {
		expect(codeParsingCommands.extractFile).toBeDefined()
	})

	it('should have a verifyIdentifiers method', () => {
		expect(codeParsingCommands.verifyIdentifiers).toBeDefined()
	})

	it('should have a verifySourceFilesIdentifiers method', () => {
		expect(codeParsingCommands.verifySourceFilesIdentifiers).toBeDefined()
	})
})