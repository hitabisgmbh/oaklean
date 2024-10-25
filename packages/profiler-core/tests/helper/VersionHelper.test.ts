import { VersionHelper } from '../../src/helper/VersionHelper'

describe('VersionHelper', () => {
	it('1.2.3 is bigger than 1.2.2', () => {
		expect(VersionHelper.compare('1.2.3', '1.2.2')).toBe(1)
	})

	it('1.2.2 is lower than 1.2.3', () => {
		expect(VersionHelper.compare('1.2.2', '1.2.3')).toBe(-1)
	})

	it('1.2.3 is equal to 1.2.3', () => {
		expect(VersionHelper.compare('1.2.3', '1.2.3')).toBe(0)
	})

	it('1.0.0 is bigger than 0.9', () => {
		expect(VersionHelper.compare('1.0.0', '0.9')).toBe(1)
	})

	it('1.0 is bigger than 0.9', () => {
		expect(VersionHelper.compare('1.0', '0.9')).toBe(1)
	})

	it('0.1.2 is lower than 0.2', () => {
		expect(VersionHelper.compare('0.1.2', '0.2')).toBe(-1)
	})

	it('0.1.2 is lower than 0.2', () => {
		expect(VersionHelper.compare('0.1.2', '0.2')).toBe(-1)
	})

	it('1.0 is greater than 0.9.9', () => {
		expect(VersionHelper.compare('1.0', '0.9.9')).toBe(1)
	})

	it('1.0.0 is equal to 1', () => {
		expect(VersionHelper.compare('1.0.0', '1')).toBe(0)
	})

	it('2.1 is greater than 2.0.9', () => {
		expect(VersionHelper.compare('2.1', '2.0.9')).toBe(1)
	})

	it('3.2.1 is lower than 3.2.2', () => {
		expect(VersionHelper.compare('3.2.1', '3.2.2')).toBe(-1)
	})

	it('1.0.10 is greater than 1.0.2', () => {
		expect(VersionHelper.compare('1.0.10', '1.0.2')).toBe(1)
	})

	it('Versions with fewer segments are correctly compared (1.0 vs 1.0.0)', () => {
		expect(VersionHelper.compare('1.0', '1.0.0')).toBe(0)
	})

	it('Empty strings are treated as equal', () => {
		expect(VersionHelper.compare('', '')).toBe(0)
	})

	it('Empty version string is considered lower than any valid version', () => {
		expect(VersionHelper.compare('', '1.0.0')).toBe(-1)
	})

	it('Any valid version is considered greater than an empty version string', () => {
		expect(VersionHelper.compare('1.0.0', '')).toBe(1)
	})

	it('Handles multi-segment versions correctly', () => {
		expect(VersionHelper.compare('1.2.3.4', '1.2.3')).toBe(1)
	})
})