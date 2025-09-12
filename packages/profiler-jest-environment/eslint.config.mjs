// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import config from '../../eslint.config.mjs'

export default defineConfig(
	{
		extends: config,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: ['./tsconfig.json']
			}
		}
	}
)
