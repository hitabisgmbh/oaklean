module.exports = {
	transform: {
		'^.+\\.ts?$': [
			'ts-jest',
			{
				diagnostics: {
					ignoreCodes: [151002]
				}
			}
		]
	},
	testEnvironment: '<rootDir>/tests/testEnv/custom.ts',
	testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
