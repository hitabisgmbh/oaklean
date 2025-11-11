// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import config from '../../eslint.config.mjs'

export default defineConfig(
	{
		extends: config,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: ['./tsconfig.eslint.json']
			}
		}
	},
	globalIgnores([
		'jest.config.js',
		'**/assets/**/*.js',
		'**/assets/**/*.jsx',
		'**/assets/**/*.ts',
		'**/assets/**/*.tsx',
		'**/__mocks__/**/*.js',
		'**/__mocks__/**/*.ts',
		'**/dist/**/*.js',
		'lib/vscode-js-profile-core/**'
	])
)
