import { DataUrlUtils } from '../../src/helper/DataUrlUtils'

describe('DataUrlUtils', () => {
	it('should have a static method isDataUrl()', () => {
		expect(DataUrlUtils.isDataUrl).toBeTruthy()
	})

	it('should have a static method base64StringFromDataUrl()', () => {
		expect(DataUrlUtils.base64StringFromDataUrl).toBeTruthy()
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

			const base64String = DataUrlUtils.base64StringFromDataUrl(validDataUrl)
			expect(base64String).not.toBeNull()
			if (base64String !== null) {
				const jsonString = Buffer.from(base64String, 'base64').toString('utf-8')
				expect(jsonString).toBe('{"version":3,"file":"index.js","sourceRoot":"","sources":["index.ts"],"names":[],"mappings":";;;AAKa,QAAA,MAAM,GAAY;IAC7B,EAAE,IAAI,EAAE,OAAO,EAAE,KAAK,EAAE,GAAG,EAAE;IAC7B,EAAE,IAAI,EAAE,QAAQ,EAAE,KAAK,EAAE,GAAG,EAAE;CAC/B,CAAC"}')
			}
			
		})
		it('should not parse invalid data url formats', () => {
			const invalidDataUrl = 'data:invalid'

			expect(DataUrlUtils.base64StringFromDataUrl(invalidDataUrl)).toBeNull()
		})
		it('should not parse data url without base64 string', () => {
			const invalidDataUrl = 'data:application/json,'

			expect(DataUrlUtils.base64StringFromDataUrl(invalidDataUrl)).toBeNull()
		})
		it('should throw error with wrong content type', () => {
			const t = () => {
				const invalidDataUrl = 'data:application/json;charset=utf-abc;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLYSxRQUFBLE1BQU0sR0FBWTtJQUM3QixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtJQUM3QixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtDQUMvQixDQUFDIn0='
				DataUrlUtils.base64StringFromDataUrl(invalidDataUrl)
			}

			expect(t).toThrowError('DataUrlUtils.base64StringFromDataUrl: The Format charset=utf-abc;base64 is not supported')
		})
	})
})
