module.exports = {
	transform: { '^.+\\.ts?$': 'ts-jest' },
	testEnvironment: '<rootDir>/tests/testEnv/custom.ts',
	testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}