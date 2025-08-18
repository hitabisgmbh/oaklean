import * as fs from 'fs'

import { UnifiedPath } from '../../src/system/UnifiedPath'
import { SourceMap, SourceMapRedirect } from '../../src/model/SourceMap'
// Types
import {
	ISourceMap,
	SOURCE_MAP_ALL_ATTRIBUTE_NAMES,
	SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES
} from '../../src/types'

describe('SourceMap', () => {
	describe('instance related', () => {
		let instance: SourceMap

		beforeEach(() => {
			instance = new SourceMap(new UnifiedPath('index.js'), {
				version: 3,
				sources: ['../src/index.ts'],
				mappings:
					';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			})
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
				mappings:
					';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			} satisfies ISourceMap

			expect(instance.toJSON()).toEqual(expected)
		})

		test('asConsumer', () => {
			expect(instance.asConsumer).toBeDefined()
		})

		test('getOriginalSourceLocation', () => {
			// non existing location
			expect(instance.getOriginalSourceLocation(1, 1)).toBeUndefined()

			// existing location
			expect(instance.getOriginalSourceLocation(6, 0)).toEqual({
				column: 0,
				line: 1,
				name: null,
				source: '../src/index.ts'
			})
		})

		test('toBase64String', () => {
			const base64String = instance.toBase64String()
			expect(base64String).toBe(
				'eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5RUFBZ0Q7QUFFaEQsa0JBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7QUFFMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBUSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO0FBRTNELFNBQVMsZUFBZSxDQUFDLFFBQWdCLEVBQUUsVUFBa0IsQ0FBQztJQUM1RCxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFcEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDckIsZUFBZSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNmLENBQUM7QUFFRCxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7QUFJckIsU0FBUyxnQkFBZ0IsQ0FBQyxDQUFTO0lBQ2pDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ1YsQ0FBQztBQUVELGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXBCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNWLFdBQVcsQ0FBQyxHQUFHLEVBQUU7SUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBIn0='
			)
		})

		test('dataUrl', () => {
			const base64String = instance.toBase64String()
			const compiledJSString =
				'//# sourceMappingURL=data:application/json;base64,' + base64String

			const sourceMap = SourceMap.fromCompiledJSString(
				new UnifiedPath('abc.js'),
				compiledJSString
			) as SourceMap
			expect(sourceMap?.toJSON()).toEqual(instance.toJSON())
		})
	})

	describe('deserialization', () => {
		describe('full', () => {
			const expected = {
				version: 3,
				file: 'index.js',
				sourceRoot: '',
				sources: [new UnifiedPath('../src/index.ts').toString()],
				sourcesContent: [''],
				names: [],
				mappings:
					';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA',
				ignoreList: []
			} satisfies ISourceMap
			const sourceMappingURLPrefix =
				'//# sourceMappingURL=data:application/json;base64,'
			const expectedBase64String =
				'eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEseUVBQWdEO0FBRWhELGtCQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBRTFCLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQVEsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQTtBQUUzRCxTQUFTLGVBQWUsQ0FBQyxRQUFnQixFQUFFLFVBQWtCLENBQUM7SUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRXBCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JCLGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDZixDQUFDO0FBRUQsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBSXJCLFNBQVMsZ0JBQWdCLENBQUMsQ0FBUztJQUNqQyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4QyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNWLENBQUM7QUFFRCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVwQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDVixXQUFXLENBQUMsR0FBRyxFQUFFO0lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQSIsImlnbm9yZUxpc3QiOltdfQ=='

			test('all fields are present', () => {
				expect(Object.keys(expected)).toEqual(SOURCE_MAP_ALL_ATTRIBUTE_NAMES)
			})

			test('base64 deserialization', () => {
				const sourceMapFromBase64 = SourceMap.fromCompiledJSString(
					new UnifiedPath('index.js'),
					sourceMappingURLPrefix + expectedBase64String
				) as SourceMap
				expect(sourceMapFromBase64.toJSON()).toEqual(expected)
				expect(sourceMapFromBase64.toBase64String()).toEqual(
					expectedBase64String
				)
			})

			test('deserialization from string', () => {
				const sourceMapFromString = SourceMap.fromJSON(JSON.stringify(expected))
				expect(sourceMapFromString.toJSON()).toEqual(expected)
			})

			test('deserialization from object', () => {
				const sourceMapFromObject = SourceMap.fromJSON(expected)
				expect(sourceMapFromObject.toJSON()).toEqual(expected)
			})
		})

		describe('minimal', () => {
			const expected = {
				version: 3,
				sources: [new UnifiedPath('../src/index.ts').toString()],
				mappings:
					';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA',
			} satisfies ISourceMap
			const sourceMappingURLPrefix =
				'//# sourceMappingURL=data:application/json;base64,'
			const expectedBase64String =
				'eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx5RUFBZ0Q7QUFFaEQsa0JBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7QUFFMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBUSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFBO0FBRTNELFNBQVMsZUFBZSxDQUFDLFFBQWdCLEVBQUUsVUFBa0IsQ0FBQztJQUM1RCxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFcEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDckIsZUFBZSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNmLENBQUM7QUFFRCxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7QUFJckIsU0FBUyxnQkFBZ0IsQ0FBQyxDQUFTO0lBQ2pDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ1YsQ0FBQztBQUVELGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXBCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNWLFdBQVcsQ0FBQyxHQUFHLEVBQUU7SUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBIn0='

			test('all fields are present', () => {
				expect(Object.keys(expected)).toEqual(
					SOURCE_MAP_REQUIRED_ATTRIBUTE_NAMES
				)
			})

			test('base64 deserialization', () => {
				const sourceMapFromBase64 = SourceMap.fromCompiledJSString(
					new UnifiedPath('index.js'),
					sourceMappingURLPrefix + expectedBase64String
				) as SourceMap
				expect(sourceMapFromBase64.toJSON()).toEqual(expected)
				expect(sourceMapFromBase64.toBase64String()).toEqual(
					expectedBase64String
				)
			})

			test('deserialization from string', () => {
				const sourceMapFromString = SourceMap.fromJSON(JSON.stringify(expected))
				expect(sourceMapFromString.toJSON()).toEqual(expected)
			})

			test('deserialization from object', () => {
				const sourceMapFromObject = SourceMap.fromJSON(expected)
				expect(sourceMapFromObject.toJSON()).toEqual(expected)
			})
		})
	})

	describe('loading from File', () => {
		it('extracts the inline source map', () => {
			const sourceMapFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'SourceMap',
				'inline.js'
			)
			const source = fs
				.readFileSync(sourceMapFilePath.toPlatformString())
				.toString()
			const sourceMap = SourceMap.fromCompiledJSString(
				sourceMapFilePath,
				source
			) as SourceMap

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
			expect(sourceMap?.mappings).toEqual(
				';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			)
			expect(sourceMap?.numberOfLinesInCompiledFile).toEqual(28)
		})

		it('extracts the extern source map', () => {
			const sourceMapFilePath = new UnifiedPath(__dirname).join(
				'assets',
				'SourceMap',
				'extern.js'
			)
			const source = fs
				.readFileSync(sourceMapFilePath.toPlatformString())
				.toString()
			const sourceMapRedirect = SourceMap.fromCompiledJSString(
				sourceMapFilePath,
				source
			)

			expect(SourceMap.isSourceMap(sourceMapRedirect)).toBe(false)
			expect((sourceMapRedirect as SourceMapRedirect).type).toBe('redirect')
			expect(
				(sourceMapRedirect as SourceMapRedirect).sourceMapLocation.toString()
			).toEqual(
				new UnifiedPath(__dirname)
					.join('assets', 'SourceMap', 'extern.js.map')
					.toString()
			)

			const sourceRedirect = fs
				.readFileSync(
					(
						sourceMapRedirect as SourceMapRedirect
					).sourceMapLocation.toPlatformString()
				)
				.toString()
			const sourceMap = SourceMap.fromJSON(sourceRedirect) as SourceMap

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
			expect(sourceMap?.mappings).toEqual(
				';;;;;AAAA,yEAAgD;AAEhD,kBAAQ,CAAC,MAAM,CAAC,SAAS,CAAC,CAAA;AAE1B,MAAM,OAAO,GAAG,IAAI,kBAAQ,CAAC,IAAI,EAAE,uBAAuB,CAAC,CAAA;AAE3D,SAAS,eAAe,CAAC,QAAgB,EAAE,UAAkB,CAAC;IAC5D,MAAM,KAAK,GAAG,IAAI,IAAI,EAAE,CAAC,OAAO,EAAE,CAAC,QAAQ,EAAE,CAAC;IAC9C,OAAO,CAAC,KAAK,CAAC,KAAK,CAAC,CAAA;IAEpB,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,MAAM,CAAC,KAAK,CAAC,CAAA;QACrB,eAAe,CAAC,QAAQ,EAAE,OAAO,EAAE,CAAC,CAAC;IACvC,CAAC,EAAE,QAAQ,CAAC,CAAC;AACf,CAAC;AAED,eAAe,CAAC,IAAI,CAAC,CAAA;AAIrB,SAAS,gBAAgB,CAAC,CAAS;IACjC,UAAU,CAAC,GAAG,EAAE;QACd,OAAO,CAAC,GAAG,CAAC,uBAAuB,EAAE,CAAC,CAAC,CAAC;QACxC,gBAAgB,CAAC,EAAE,CAAC,CAAC,CAAC;IACxB,CAAC,EAAE,IAAI,CAAC,CAAA;AACV,CAAC;AAED,gBAAgB,CAAC,CAAC,CAAC,CAAC;AAEpB,IAAI,CAAC,GAAG,CAAC,CAAC;AACV,WAAW,CAAC,GAAG,EAAE;IACf,OAAO,CAAC,GAAG,CAAC,gCAAgC,EAAE,CAAC,EAAE,CAAC,CAAC;AACrD,CAAC,EAAE,IAAI,CAAC,CAAA'
			)
			expect(sourceMap?.numberOfLinesInCompiledFile).toEqual(28)
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
			expect(SourceMap.isSourceMap(null)).toBe(false)
		})
	})
})
