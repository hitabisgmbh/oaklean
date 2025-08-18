import * as ts from 'typescript'

import { TypescriptHelper } from '../../../src/helper/TypescriptParser/TypescriptHelper'

describe('TypescriptHelper', () => {
	it('should have a static method posToLoc()', () => {
		expect(TypescriptHelper.posToLoc).toBeTruthy()
	})

	describe('posToLoc', () => {
		const sourceFile = ts.createSourceFile(
			'index.ts',
			'const who = \'World\'\n\nconsole.log(\'Hello\')\nconsole.log(who)',
			ts.ScriptTarget.Latest,
			true /*setParentNodes */
		)

		it('should return the correct line and colum', () => {
			expect(TypescriptHelper.posToLoc(sourceFile, 42)).toEqual({
				line: 4,
				column: 0
			})
			expect(TypescriptHelper.posToLoc(sourceFile, 41)).toEqual({
				line: 3,
				column: 20
			})
		})
	})
})