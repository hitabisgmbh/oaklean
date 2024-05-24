import { UnifiedPath } from '../../src/system/UnifiedPath'
import { SourceMap, ISourceMap } from '../../src/model/SourceMap'

describe('SourceMap', () => {
	describe('instance related', () => {
		let instance: SourceMap

		beforeEach(() => {
			instance = new SourceMap(
				new UnifiedPath('index.js'),
				new UnifiedPath('index.js'),
				3,
				[
					new UnifiedPath('../src/index.ts'),
				],
				[],
				';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			)
		})

		it('instance should be an instanceof SourceMap', () => {
			expect(instance instanceof SourceMap).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a method asConsumer()', () => {
			expect(instance.asConsumer).toBeTruthy()
		})

		it('should have a method getOriginalSourceLocation()', () => {
			expect(instance.getOriginalSourceLocation).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SourceMap.fromJSON).toBeTruthy()
		})

		it('should serialize correctly', () => {
			const expected = {
				version: 3,
				sources: [new UnifiedPath('../src/index.ts').toString()],
				names: [],
				mappings: ';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			} satisfies ISourceMap

			expect(instance.toJSON()).toEqual(expected)
		})

		test('asConsumer', () => {
			expect(instance.asConsumer).toBeDefined()
		})

		test('getOriginalSourceLocation', () => {
			expect(instance.getOriginalSourceLocation(1, 1)).toEqual({
				column: 0,
				line: 1,
				name: null,
				source: '../src/index.ts',
			})
		})
	})

	describe('deserialization', () => {
		const expected = {
			version: 3,
			sources: [
				new UnifiedPath('../src/index.ts').toString()
			],
			names: [],
			mappings: ';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
		} satisfies ISourceMap

		test('deserialization from string', () => {
			const sourceMapFromString = SourceMap.fromJSON(JSON.stringify(expected))
			expect(sourceMapFromString.toJSON()).toEqual(expected)
		})

		test('deserialization from object', () => {
			const sourceMapFromObject = SourceMap.fromJSON(expected)
			expect(sourceMapFromObject.toJSON()).toEqual(expected)
		})
	})

	describe('loading from File', () => {
		it('extracts the inline source map', () => {
			const sourceMapFilePath = new UnifiedPath(__dirname).join('assets', 'SourceMap', 'inline.js')
			const sourceMap = SourceMap.fromCompiledJSFile(sourceMapFilePath)

			expect(sourceMap).toBeDefined()
			expect(SourceMap.isSourceMap(sourceMap)).toBe(true)

			// test types
			expect(typeof sourceMap?.version).toBe('number')
			expect(sourceMap?.sources).toBeInstanceOf(Array)
			expect(sourceMap?.names).toBeInstanceOf(Array)
			expect(typeof sourceMap?.mappings).toBe('string')
			expect(typeof sourceMap?.numberOfLinesInCompiledFile).toBe('number')

			// test values
			expect(sourceMap?.version).toBe(3)
			expect(sourceMap?.sources).toEqual(['../src/index.ts'])
			expect(sourceMap?.names).toEqual([])
			expect(sourceMap?.mappings).toEqual(';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA')
			expect(sourceMap?.numberOfLinesInCompiledFile).toEqual(28)
		})

		it('extracts the extern source map', () => {
			const sourceMapFilePath = new UnifiedPath(__dirname).join('assets', 'SourceMap', 'extern.js')
			const sourceMap = SourceMap.fromCompiledJSFile(sourceMapFilePath)

			expect(SourceMap.isSourceMap(sourceMap)).toBe(true)

			// test types
			expect(typeof sourceMap?.version).toBe('number')
			expect(sourceMap?.sources).toBeInstanceOf(Array)
			expect(sourceMap?.names).toBeInstanceOf(Array)
			expect(typeof sourceMap?.mappings).toBe('string')
			expect(typeof sourceMap?.numberOfLinesInCompiledFile).toBe('number')

			// test values
			expect(sourceMap?.version).toBe(3)
			expect(sourceMap?.sources).toEqual(['../src/index.ts'])
			expect(sourceMap?.names).toEqual([])
			expect(sourceMap?.mappings).toEqual(';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA')
			expect(sourceMap?.numberOfLinesInCompiledFile).toEqual(28)
		})

		it('returns undefined if the file path does not exist', () => {
			const sourceMapFilePath = new UnifiedPath(__dirname).join('abc.js')
			const sourceMap = SourceMap.fromCompiledJSFile(sourceMapFilePath)

			expect(sourceMap).toBeUndefined()
		})
	})

	describe('sourceMapParser', () => {
		it('check the correct format', () => {
			const validFormat = {
				version: 3,
				file: '',
				sourceRoot: '',
				sources: '',
				names: '',
				mappings: ''
			}

			const inValidFormat = {
				file: '',
				sourceRoot: '',
				sources: '',
				names: '',
				mappings: ''
			}

			expect(SourceMap.isSourceMap(validFormat)).toBe(true)
			expect(SourceMap.isSourceMap(inValidFormat)).toBe(false)
			expect(SourceMap.isSourceMap(undefined)).toBe(false)
		})
	})
})
