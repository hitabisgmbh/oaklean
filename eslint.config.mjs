// @ts-check

import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import eslintPluginImport from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	prettierConfig,
	{
		// rules not applied to test files
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'error'
		},
		ignores: ['**/*.test.ts']
	},
	{
		plugins: {
			'@stylistic': stylistic,
			import: eslintPluginImport,
			prettier: prettierPlugin
		},
		rules: {
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'enumMember',
					format: ['camelCase', 'UPPER_CASE', 'PascalCase']
				}
			],
			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
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

			// Prettier rule
      'prettier/prettier': 'error'
		}
	},
	globalIgnores([
		'**/*.d.ts',
		'**/node_modules/**',
		'**/coverage/**/*',
		'**/jest.config.js',
		'**/eslint.config.mjs'
	])
)
