import * as fs from 'fs'

import { VERSION } from '../../src/constants/app'
import { ModuleReport, IModuleReport } from '../../src/model/ModuleReport'
import { NodeModule, NodeModuleIdentifier_string } from '../../src/model/NodeModule'
import { ReportKind } from '../../src/model/Report'
import { GlobalIndex } from '../../src/model/index/GlobalIndex'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { PermissionHelper } from '../../dist/src'

const CURRENT_DIR = new UnifiedPath(__dirname)

const EXAMPLE_MODULE_REPORT: IModuleReport = {
	reportVersion: VERSION,
	kind: ReportKind.measurement,
	nodeModule: {
		name: 'package-name',
		version: '1.0.1'
	},
	relativeRootDir: undefined
}
const EXAMPLE_MODULE_REPORT_BUFFER = fs.readFileSync(CURRENT_DIR.join('assets', 'ProjectReport', 'module-report.instance.buffer').toString()).toString()

function runInstanceTests(title: string, preDefinedInstance: () => ModuleReport) {
	let instance: ModuleReport

	describe(title, () => {
		beforeEach(() => {
			instance = preDefinedInstance()
		})

		it('instance should be an instanceof ModuleReport', () => {
			expect(instance instanceof ModuleReport).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(ModuleReport.fromJSON).toBeTruthy()
		})

		it('should have a static method merge()', () => {
			expect(ModuleReport.merge).toBeTruthy()
		})

		it('serializes correctly', () => {
			expect(instance.toJSON()).toEqual(EXAMPLE_MODULE_REPORT)
		})

		test('toBuffer', () => {
			const bufferString = instance.toBuffer().toString('hex')
			if (UPDATE_TEST_REPORTS && title === 'instance related') {
				PermissionHelper.writeFileWithUserPermission(
					CURRENT_DIR.join('assets', 'ProjectReport', 'module-report.instance.buffer').toPlatformString(),
					bufferString
				)
			}
			
			expect(bufferString).toBe(EXAMPLE_MODULE_REPORT_BUFFER)
		})
	})
}

describe('ModuleReport', () => {
	runInstanceTests('instance related', () => {
		const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
		const moduleIndex = globalIndex.getModuleIndex('upsert', 'package-name' as NodeModuleIdentifier_string)

		return new ModuleReport(
			moduleIndex,
			new NodeModule(
				'package-name',
				'1.0.1'
			),
			ReportKind.measurement
		)
	})
	
	describe('deserialization', () => {
		test('deserialization from string', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex(
				'upsert',
				`${EXAMPLE_MODULE_REPORT.nodeModule.name}` +
				`@${EXAMPLE_MODULE_REPORT.nodeModule.version}` as NodeModuleIdentifier_string
			)

			const reportFromString = ModuleReport.fromJSON(JSON.stringify(EXAMPLE_MODULE_REPORT), moduleIndex)
			expect(reportFromString.toJSON()).toEqual(EXAMPLE_MODULE_REPORT)
		})

		test('deserialization from object', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex(
				'upsert',
				`${EXAMPLE_MODULE_REPORT.nodeModule.name}` +
				`@${EXAMPLE_MODULE_REPORT.nodeModule.version}` as NodeModuleIdentifier_string
			)

			const reportFromObject = ModuleReport.fromJSON(EXAMPLE_MODULE_REPORT, moduleIndex)
			expect(reportFromObject.toJSON()).toEqual(EXAMPLE_MODULE_REPORT)
		})

		runInstanceTests('deserialization instance related', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex(
				'upsert',
				`${EXAMPLE_MODULE_REPORT.nodeModule.name}` +
				`@${EXAMPLE_MODULE_REPORT.nodeModule.version}` as NodeModuleIdentifier_string
			)
			return ModuleReport.fromJSON(JSON.stringify(EXAMPLE_MODULE_REPORT), moduleIndex)
		})
	})

	describe('consume from buffer', () => {
		const buffer = Buffer.from(EXAMPLE_MODULE_REPORT_BUFFER, 'hex')

		test('consume from buffer', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			globalIndex.getModuleIndex(
				'upsert',
				`${EXAMPLE_MODULE_REPORT.nodeModule.name}`+
				`@${EXAMPLE_MODULE_REPORT.nodeModule.version}` as NodeModuleIdentifier_string
			)
			const { instance, remainingBuffer } = ModuleReport.consumeFromBuffer_ModuleReport(buffer, globalIndex)
			expect(instance.toJSON()).toEqual(EXAMPLE_MODULE_REPORT)
			expect(remainingBuffer.byteLength).toBe(0)
		})

		runInstanceTests('consume from buffer instance related', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			globalIndex.getModuleIndex(
				'upsert',
				`${EXAMPLE_MODULE_REPORT.nodeModule.name}` +
				`@${EXAMPLE_MODULE_REPORT.nodeModule.version}` as NodeModuleIdentifier_string
			)
			const { instance } = ModuleReport.consumeFromBuffer_ModuleReport(buffer, globalIndex)
			return instance
		})
	})

	describe('merging', () => {
		let instancesToMerge: ModuleReport[] = []

		beforeEach(() => {
			const firstGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const firstModuleIndex = firstGlobalIndex.getModuleIndex('upsert', 'package-name' as NodeModuleIdentifier_string)

			const first = new ModuleReport(
				firstModuleIndex,
				new NodeModule(
					'package-name',
					'1.0.1'
				),
				ReportKind.measurement
			)

			const secondsGlobalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const secondModuleIndex = secondsGlobalIndex.getModuleIndex('upsert', 'package-name' as NodeModuleIdentifier_string)

			const second = new ModuleReport(
				secondModuleIndex,
				new NodeModule(
					'package-name',
					'1.0.1'
				),
				ReportKind.measurement
			)

			instancesToMerge = [first, second]
		})

		test('empty arguments', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			const t = () => {
				ModuleReport.merge(moduleIndex, ...[])
			}

			expect(t).toThrowError('ModuleReport.merge: no ModuleReports were given')
		})

		test('wrong modules', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')
			instancesToMerge[0].nodeModule.name = 'abcd'

			const t = () => {
				ModuleReport.merge(moduleIndex, ...instancesToMerge)
			}

			expect(t).toThrowError('ModuleReport.merge: all ModuleReports should be from the same module.')
		})

		test('merges correctly', () => {
			const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			const moduleIndex = globalIndex.getModuleIndex('upsert')

			expect(ModuleReport.merge(moduleIndex, ...instancesToMerge).toJSON()).toEqual({
				kind: ReportKind.accumulated,
				reportVersion: instancesToMerge[0].reportVersion,
				nodeModule: {
					name: 'package-name',
					version: '1.0.1'
				}
			})
		})
	})
})