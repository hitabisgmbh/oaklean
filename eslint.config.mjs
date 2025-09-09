// @ts-check

import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import eslintPluginImport from 'eslint-plugin-import'

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	{
		// rules not applied to test files
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'error',
			'max-len': ['error', { code: 120, ignoreTrailingComments: true, ignoreStrings: true, ignoreRegExpLiterals: true }],
		},
		ignores: ['**/*.test.ts']
	},
	{
		plugins: {
			'@stylistic': stylistic,
			'import': eslintPluginImport
		},
		rules: {
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'enumMember',
					format: ['camelCase', 'UPPER_CASE', 'PascalCase']
				}
			],
			'@typescript-eslint/semi': 'off',
			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
			// '@stylistic/indent': ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'never'],
			'comma-dangle': ['error', 'only-multiline'],
			'no-empty': [
				'error',
				{
					allowEmptyCatch: true
				}
			],
			'no-use-before-define': ['off'],
			'import/extensions': ['off', 'ignorePackages'],
			'import/order': [
				'error',
				{
					'newlines-between': 'always',
					groups: [
						'builtin',
						'external',
						'internal',
						'index',
						'sibling',
						'parent'
					]
				}
			],
			'no-multi-spaces': [
				'error',
				{
					exceptions: {
						VariableDeclarator: true,
						ImportDeclaration: true
					}
				}
			],
			'keyword-spacing': 'error',
			'brace-style': 'error'
		}
	},
	globalIgnores([
		'**/*.d.ts',
		'**/node_modules/**',
		'**/jest.config.js',
		'**/eslint.config.mjs'
	])
)
