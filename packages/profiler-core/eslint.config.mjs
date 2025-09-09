// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import config from '../../eslint.config.mjs'
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
	{
		extends: config,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: __dirname
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
