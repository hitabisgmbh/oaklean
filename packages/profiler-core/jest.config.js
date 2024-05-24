module.exports = {
	transform: { '^.+\\.ts?$': 'ts-jest' },
	testEnvironment: '@oaklean/profiler-jest-environment/env.js',
	globalSetup: '@oaklean/profiler-jest-environment/setup.js',
	globalTeardown: '@oaklean/profiler-jest-environment/teardown.js',
	testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}