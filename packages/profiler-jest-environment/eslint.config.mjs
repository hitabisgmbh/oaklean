// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config'
import config from '../../eslint.config.mjs'

export default defineConfig(
	config,
	globalIgnores(['**/*.js'])
)
