import { NodeModule } from '../../src/model/NodeModule'
import { SourceNodeIdentifier_string, GlobalSourceNodeIdentifier_string } from '../../src/types/SourceNodeIdentifiers.types'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'

describe('GlobalIdentifier', () => {
	describe('instance related', () => {
		let internInstance: GlobalIdentifier
		let externInstance: GlobalIdentifier

		beforeEach(() => {
			const nodeModule = new NodeModule(
				'@scope/package',
				'1.0.1'
			)

			internInstance = new GlobalIdentifier(
				new UnifiedPath('./path/to/file.js').toString(),
				'{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as SourceNodeIdentifier_string,
			)

			externInstance = new GlobalIdentifier(
				new UnifiedPath('./path/to/file.js').toString(),
				'{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as SourceNodeIdentifier_string,
				nodeModule
			)
		})

		it('instance should be an instanceof GlobalIdentifier', () => {
			expect(internInstance instanceof GlobalIdentifier).toBeTruthy()
		})

		it('should have a method identifier()', () => {
			expect(internInstance.identifier).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(internInstance.toJSON).toBeTruthy()
		})

		test('identifier', () => {
			expect(internInstance.identifier).toBe(
				'{./path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
			)
			expect(externInstance.identifier).toBe(
				'@scope/package@1.0.1{./path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
			)
		})

		test('serialization', () => {
			expect(internInstance.toJSON()).toEqual({
				path: './path/to/file.js',
				sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
			})

			expect(externInstance.toJSON()).toEqual({
				nodeModule: {
					name: '@scope/package',
					version: '1.0.1'
				},
				path: './path/to/file.js',
				sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
			})
		})
	})

	describe('fromIdentifier', () => {
		test('invalid fromat', () => {
			const a = () => {
				GlobalIdentifier.fromIdentifier(
					'{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
				)
			}

			expect(a).toThrowError('GlobalIdentifier.fromIdentifier: invalid format: {root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}')

			const b = () => {
				GlobalIdentifier.fromIdentifier(
					'./path/to/file.js' as GlobalSourceNodeIdentifier_string
				)
			}

			expect(b).toThrowError('GlobalIdentifier.fromIdentifier: invalid format: ./path/to/file.js')
		})

		describe('valid format', () => {
			test('with scoped node module', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'@scope/package@1.0.1{./path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					nodeModule: {
						name: '@scope/package',
						version: '1.0.1'
					},
					path: './path/to/file.js',
					sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
				})
			})
			test('with non scoped node module', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'package@1.0.1{./path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					nodeModule: {
						name: 'package',
						version: '1.0.1'
					},
					path: './path/to/file.js',
					sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
				})
			})
			test('without node module', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{./path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: './path/to/file.js',
					sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
				})
			})
			test('without upwards path', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{../path/to/file.js}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: '../path/to/file.js',
					sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
				})
			})
			test('without empty path', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{}{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: '',
					sourceNodeIdentifier: '{root}.{class:Parent}.{constructor:constructor}.{functionExpression:(anonymous:0)}'
				})
			})
			test('with lang internal identifier case 1', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{}{(anonymous)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: '',
					sourceNodeIdentifier: '{(anonymous)}'
				})
			})
			test('with lang internal identifier case 2', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{}RegExp: ^(?:[a-zA-Z]:)?\\\\?\\\\(?:[^\\\\/:*?"<>|\\r\\n]+\\\\)*[^\\\\/:*?"<>|\\r\\n]*$' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: '',
					sourceNodeIdentifier: 'RegExp: ^(?:[a-zA-Z]:)?\\\\?\\\\(?:[^\\\\/:*?"<>|\\r\\n]+\\\\)*[^\\\\/:*?"<>|\\r\\n]*$'
				})
			})
			test('with lang internal identifier case 3', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{node:internal/modules/cjs/helpers}{require}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: 'node:internal/modules/cjs/helpers',
					sourceNodeIdentifier: '{require}'
				})
			})
			test('with lang internal identifier case 4', () => {
				expect(
					GlobalIdentifier.fromIdentifier(
						'{node:internal/validators}{(anonymous)}' as GlobalSourceNodeIdentifier_string
					).toJSON()
				).toEqual({
					path: 'node:internal/validators',
					sourceNodeIdentifier: '{(anonymous)}'
				})
			})
		})
	})
})