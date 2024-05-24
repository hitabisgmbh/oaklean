import { DataUrlUtils } from '../../src/helper/DataUrlUtils'

describe('DataUrlUtils', () => {
	it('should have a static method isDataUrl()', () => {
		expect(DataUrlUtils.isDataUrl).toBeTruthy()
	})

	it('should have a static method parseDataUrl()', () => {
		expect(DataUrlUtils.parseDataUrl).toBeTruthy()
	})

	describe('isDataUrl', () => {
		it('should identify valid data url formats', () => {
			const validDataUrl = 'data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLYSxRQUFBLE1BQU0sR0FBWTtJQUM3QixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtJQUM3QixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtDQUMvQixDQUFDIn0='

			expect(DataUrlUtils.isDataUrl(validDataUrl)).toBe(true)
		})
		it('should identify invalid data url formats', () => {
			const invalidDataUrl = 'data:invalid'

			expect(DataUrlUtils.isDataUrl(invalidDataUrl)).toBe(false)
		})
	})

	describe('parseDataUrl', () => {
		it('should parse valid data url formats', () => {
			const validDataUrl = 'data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLYSxRQUFBLE1BQU0sR0FBWTtJQUM3QixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtJQUM3QixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtDQUMvQixDQUFDIn0='

			expect(DataUrlUtils.parseDataUrl(validDataUrl)).toBe('{"version":3,"file":"index.js","sourceRoot":"","sources":["index.ts"],"names":[],"mappings":";;;AAKa,QAAA,MAAM,GAAY;IAC7B,EAAE,IAAI,EAAE,OAAO,EAAE,KAAK,EAAE,GAAG,EAAE;IAC7B,EAAE,IAAI,EAAE,QAAQ,EAAE,KAAK,EAAE,GAAG,EAAE;CAC/B,CAAC"}')
		})
		it('should not parse invalid data url formats', () => {
			const invalidDataUrl = 'data:invalid'

			expect(DataUrlUtils.parseDataUrl(invalidDataUrl)).toBe('{}')
		})
		it('should not parse data url without base64 string', () => {
			const invalidDataUrl = 'data:application/json,'

			expect(DataUrlUtils.parseDataUrl(invalidDataUrl)).toBe('{}')
		})
		it('should throw error with wrong content type', () => {
			const t = () => {
				const invalidDataUrl = 'data:application/json;charset=utf-abc;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLYSxRQUFBLE1BQU0sR0FBWTtJQUM3QixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtJQUM3QixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtDQUMvQixDQUFDIn0='
				DataUrlUtils.parseDataUrl(invalidDataUrl)
			}

			expect(t).toThrowError('DataUrlUtils.parseDataUrl: The Format charset=utf-abc;base64 is not supported')
		})
	})
})
