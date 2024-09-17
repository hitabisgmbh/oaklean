import * as fs from 'fs'

import { NodeModule } from '../../src/model/NodeModule'
import { SourceFileMetaDataTree } from '../../src/model/SourceFileMetaDataTree'
import { SourceNodeMetaData } from '../../src/model/SourceNodeMetaData'
import { ModelMap } from '../../src/model/ModelMap'
import { ProjectReport } from '../../src/model/ProjectReport'
import { SourceFileMetaData, AggregatedSourceNodeMetaData } from '../../src/model/SourceFileMetaData'
import { UnifiedPath } from '../../src/system/UnifiedPath'
import { SensorValues } from '../../src/model/SensorValues'
import { GlobalIndex } from '../../src/model/index/GlobalIndex'
import { GlobalIdentifier } from '../../src/system/GlobalIdentifier'
import { UPDATE_TEST_REPORTS } from '../constants/env'
import {
	ISourceFileMetaDataTree,
	SourceFileMetaDataTreeType,
	ISourceNodeMetaData,
	SourceNodeMetaDataType,
	NodeModuleIdentifier_string,
	UnifiedPathPart_string,
	UnifiedPath_string,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	ModuleID_number,
	PathID_number,
	SourceNodeID_number
} from '../../src/types'

const CURRENT_DIR = new UnifiedPath(__dirname)

describe('SourceFileMetaDataTree', () => {
	describe('instance related', () => {
		let globalIndex: GlobalIndex
		let instance: SourceFileMetaDataTree<SourceFileMetaDataTreeType.Root>

		beforeEach(() => {
			globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
			instance = new SourceFileMetaDataTree(
				SourceFileMetaDataTreeType.Root,
				undefined,
				globalIndex
			)
			const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex(
				'upsert',
				'./directory/file' as UnifiedPath_string
			)

			const sourceFileMetaData = SourceFileMetaData.fromJSON(
				{
					path: './directory/file' as UnifiedPath_string,
					functions: {
						[pathIndex.getSourceNodeIndex('upsert', '{root}.{class:Class}.{method:method}' as SourceNodeIdentifier_string).id]: {
							id: pathIndex.getSourceNodeIndex('upsert', '{root}.{class:Class}.{method:method}' as SourceNodeIdentifier_string).id,
							type: SourceNodeMetaDataType.SourceNode,
							sensorValues: {
								profilerHits: 1,
								selfCPUTime: 200,
								aggregatedCPUTime: 200
							}
						}
					}
				},
				pathIndex
			)

			const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
				sourceFileMetaData.totalSourceNodeMataData(),
				sourceFileMetaData.maxSourceNodeMataData()
			)

			instance.insertPath(
				new UnifiedPath('./directory/file').split(),
				undefined,
				undefined,
				aggregatedSourceNodeMetaData,
				sourceFileMetaData
			)
		})

		it('instance should be an instanceof SourceFileMetaDataTree', () => {
			expect(instance instanceof SourceFileMetaDataTree).toBeTruthy()
		})

		it('should have a method storeToFile()', () => {
			expect(instance.storeToFile).toBeTruthy()
		})

		it('should have a method toJSON()', () => {
			expect(instance.toJSON).toBeTruthy()
		})

		it('should have a static method fromJSON()', () => {
			expect(SourceFileMetaDataTree.fromJSON).toBeTruthy()
		})

		it('should have a static method loadFromFile()', () => {
			expect(SourceFileMetaDataTree.loadFromFile).toBeTruthy()
		})

		it('should have a method addToAggregatedInternSourceNodeMetaDataOfTree()', () => {
			expect(instance.addToAggregatedInternSourceNodeMetaDataOfTree).toBeTruthy()
		})

		it('should have a static method fromProjectReport()', () => {
			expect(SourceFileMetaDataTree.fromProjectReport).toBeTruthy()
		})

		it('should have a method insertPath()', () => {
			expect(instance.insertPath).toBeTruthy()
		})

		it('should have a method addProjectReport()', () => {
			expect(instance.addProjectReport).toBeTruthy()
		})

		it('should have a method validate()', () => {
			expect(instance.validate).toBeTruthy()
		})

		it('should have a getter aggregatedLangInternalSourceNodeMetaData()', () => {
			expect(instance.aggregatedLangInternalSourceNodeMetaData).toBeTruthy()
		})

		it('should have a getter aggregatedInternSourceMetaData()', () => {
			expect(instance.aggregatedInternSourceMetaData).toBeTruthy()
		})

		it('should have a getter aggregatedExternSourceMetaData()', () => {
			expect(instance.aggregatedExternSourceMetaData).toBeTruthy()
		})

		it('should have a getter internChildren()', () => {
			expect(instance.internChildren).toBeTruthy()
		})

		it('should have a getter externChildren()', () => {
			expect(instance.externChildren).toBeTruthy()
		})

		test('serialization', () => {
			const expectedObj: ISourceFileMetaDataTree<SourceFileMetaDataTreeType.Root> = {
				filePath: undefined,
				aggregatedInternSourceMetaData: {
					total: {
						type: SourceNodeMetaDataType.Aggregate,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 200,
							aggregatedCPUTime: 200
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
					max: {
						type: SourceNodeMetaDataType.Aggregate,
						sensorValues: {
							profilerHits: 1,
							selfCPUTime: 200,
							aggregatedCPUTime: 200
						}
					} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
				},
				type: SourceFileMetaDataTreeType.Root,
				internChildren: {
					['directory' as UnifiedPathPart_string]: {
						engineModule: undefined,
						aggregatedInternSourceMetaData: {
							total: {
								type: SourceNodeMetaDataType.Aggregate,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 200,
									aggregatedCPUTime: 200
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
							max: {
								type: SourceNodeMetaDataType.Aggregate,
								sensorValues: {
									profilerHits: 1,
									selfCPUTime: 200,
									aggregatedCPUTime: 200
								}
							} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
						},
						globalIndex: undefined,
						type: SourceFileMetaDataTreeType.Directory,
						filePath: './directory' as UnifiedPath_string,
						internChildren: {
							['file' as UnifiedPathPart_string]: {
								engineModule: undefined,
								globalIndex: undefined,
								aggregatedInternSourceMetaData: {
									total: {
										type: SourceNodeMetaDataType.Aggregate,
										sensorValues: {
											profilerHits: 1,
											selfCPUTime: 200,
											aggregatedCPUTime: 200
										}
									} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>,
									max: {
										type: SourceNodeMetaDataType.Aggregate,
										sensorValues: {
											profilerHits: 1,
											selfCPUTime: 200,
											aggregatedCPUTime: 200
										}
									} as ISourceNodeMetaData<SourceNodeMetaDataType.Aggregate>
								},
								type: SourceFileMetaDataTreeType.File,
								filePath: './directory/file' as UnifiedPath_string,
								internChildren: {},
								sourceFileMetaData: {
									path: './directory/file' as UnifiedPath_string,
									functions: {
										[instance.index.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./directory/file}{root}.{class:Class}.{method:method}' as GlobalSourceNodeIdentifier_string)).id]: {
											id: instance.index.getSourceNodeIndex('upsert', GlobalIdentifier.fromIdentifier('{./directory/file}{root}.{class:Class}.{method:method}' as GlobalSourceNodeIdentifier_string)).id,
											type: SourceNodeMetaDataType.SourceNode,
											sensorValues: {
												profilerHits: 1,
												selfCPUTime: 200,
												aggregatedCPUTime: 200
											}
										} as ISourceNodeMetaData<SourceNodeMetaDataType.SourceNode>
									}
								}
							}
						}
					}
				},
				globalIndex: {
					currentId: 3,
					moduleMap: {
						['{self}' as NodeModuleIdentifier_string]: {
							id: 0 as ModuleID_number,
							children: {
								'directory': {
									children: {
										'file': {
											id: 1 as PathID_number,
											file: {
												'{root}': {
													id: undefined,
													children: {
														'{class:Class}': {
															id: undefined,
															children: {
																'{method:method}': {
																	id: 2 as SourceNodeID_number
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				},
				engineModule: NodeModule.currentEngineModule().toJSON(),
			}

			expect(JSON.stringify(instance)).toEqual(JSON.stringify(expectedObj))
		})

		test('storeToFile', () => {
			const sourceFileMetaDataTreePath = CURRENT_DIR.join('..', '..', '..', '..', 'profiles', 'test-profile', 'sourceFileMetaDataTree.json')
			if (fs.existsSync(sourceFileMetaDataTreePath.dirName().toPlatformString())) {
				fs.rmSync(sourceFileMetaDataTreePath.dirName().toPlatformString(), {
					recursive: true
				})
			}

			instance.storeToFile(sourceFileMetaDataTreePath)

			expect(fs.existsSync(sourceFileMetaDataTreePath.toString())).toBeTruthy()
		})

		describe('insertPath', () => {
			test('duplicated insertion', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const pathIndex = globalIndex.getModuleIndex('upsert').getFilePathIndex(
					'upsert',
					'./directory/file' as UnifiedPath_string
				)
				const t = () => {
					const sourceFileMetaData = SourceFileMetaData.fromJSON({
						path: './directory/file' as UnifiedPath_string,
						functions: {
							[pathIndex.getSourceNodeIndex('upsert', '{root}.{class:Class}.{method:method}' as SourceNodeIdentifier_string).id]: {
								id: pathIndex.getSourceNodeIndex('upsert', '{root}.{class:Class}.{method:method}' as SourceNodeIdentifier_string).id,
								type: SourceNodeMetaDataType.SourceNode,
								sensorValues: {
									profilerHits: 1
								}
							}
						}
					}, pathIndex)

					const aggregatedSourceNodeMetaData = new AggregatedSourceNodeMetaData(
						sourceFileMetaData.totalSourceNodeMataData(),
						sourceFileMetaData.maxSourceNodeMataData()
					)

					instance.insertPath(
						new UnifiedPath('./directory/file').split(),
						undefined,
						undefined,
						aggregatedSourceNodeMetaData,
						sourceFileMetaData
					)
				}
				expect(t).toThrowError('SourceFileMetaDataTree.insertPath: path was already inserted ./directory/file')
			})
		})
	})

	describe('getter', () => {
		describe('aggregatedInternalSourceNodeMetaData', () => {
			test('defined', () => {
				const expected = new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 1,
							selfCPUTime: 2,
							aggregatedCPUTime: 3,
							internCPUTime: 4,
							externCPUTime: 5,
							langInternalCPUTime: 6
						}),
						undefined
					),
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 7,
							selfCPUTime: 8,
							aggregatedCPUTime: 9,
							internCPUTime: 10,
							externCPUTime: 11,
							langInternalCPUTime: 12
						}),
						undefined
					),
				)
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						aggregatedLangInternalSourceNodeMetaData: expected.toJSON(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedLangInternalSourceNodeMetaData.total,
						expected.total
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedLangInternalSourceNodeMetaData.max,
						expected.max
					)
				)
			})

			test('not defined', () => {
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedLangInternalSourceNodeMetaData.total,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						),
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedLangInternalSourceNodeMetaData.max,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						),
					)
				)
			})
		})

		describe('aggregatedInternSourceMetaData', () => {
			test('defined', () => {
				const expected = new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 1,
							selfCPUTime: 2,
							aggregatedCPUTime: 3,
							internCPUTime: 4,
							externCPUTime: 5,
							langInternalCPUTime: 6
						}),
						undefined
					),
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 7,
							selfCPUTime: 8,
							aggregatedCPUTime: 9,
							internCPUTime: 10,
							externCPUTime: 11,
							langInternalCPUTime: 12
						}),
						undefined
					),
				)

				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						aggregatedInternSourceMetaData: expected.toJSON(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedInternSourceMetaData.total,
						expected.total
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedInternSourceMetaData.max,
						expected.max
					)
				)
			})

			test('not defined', () => {
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedInternSourceMetaData.total,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						),
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedInternSourceMetaData.max,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						),
					)
				)
			})
		})

		describe('aggregatedExternSourceMetaData', () => {
			test('defined', () => {
				const expected = new AggregatedSourceNodeMetaData(
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 1,
							selfCPUTime: 2,
							aggregatedCPUTime: 3,
							internCPUTime: 4,
							externCPUTime: 5,
							langInternalCPUTime: 6
						}),
						undefined
					),
					new SourceNodeMetaData(
						SourceNodeMetaDataType.Aggregate,
						undefined,
						new SensorValues({
							profilerHits: 7,
							selfCPUTime: 8,
							aggregatedCPUTime: 9,
							internCPUTime: 10,
							externCPUTime: 11,
							langInternalCPUTime: 12
						}),
						undefined
					),
				)

				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						aggregatedExternSourceMetaData: expected.toJSON(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedExternSourceMetaData.total,
						expected.total
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedExternSourceMetaData.max,
						expected.max
					)
				)
			})

			test('not defined', () => {
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Directory,
						filePath: new UnifiedPath('./').toString(),
						globalIndex: undefined,
						engineModule: undefined
					},
					SourceFileMetaDataTreeType.Directory,
					new GlobalIndex(NodeModule.currentEngineModule()).getModuleIndex('upsert')
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedExternSourceMetaData.total,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						)
					)
				)
				expect(
					SourceNodeMetaData.equals(
						instance.aggregatedExternSourceMetaData.max,
						new SourceNodeMetaData(
							SourceNodeMetaDataType.Aggregate,
							undefined,
							new SensorValues({
								profilerHits: 0,
								selfCPUTime: 0,
								aggregatedCPUTime: 0,
								internCPUTime: 0,
								externCPUTime: 0,
								langInternalCPUTime: 0
							}),
							undefined
						),
					)
				)
			})
		})

		describe('internChildren', () => {
			test('defined', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())

				const expected = new ModelMap<
				UnifiedPathPart_string, SourceFileMetaDataTree<SourceFileMetaDataTreeType.File>>('string')
				expected.set('file.js' as UnifiedPathPart_string, new SourceFileMetaDataTree(
					SourceFileMetaDataTreeType.File,
					new UnifiedPath('./file.js'),
					globalIndex.getModuleIndex('upsert').getFilePathIndex('upsert', './file.js' as UnifiedPath_string)
				))

				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Root,
						filePath: undefined,
						engineModule: NodeModule.currentEngineModule().toJSON(),
						internChildren: {
							['file.js' as UnifiedPathPart_string]: {
								type: SourceFileMetaDataTreeType.File,
								filePath: new UnifiedPath('./file.js').toString(),
								globalIndex: undefined,
								engineModule: undefined
							}
						},
						globalIndex: {
							currentId: 2,
							moduleMap: {
								['{self}' as NodeModuleIdentifier_string]: {
									id: 0 as ModuleID_number,
									children: {
										'file.js': {
											id: 1 as PathID_number
										}
									}
								}
							}
						}
					},
					SourceFileMetaDataTreeType.Root,
					undefined
				)
				expect(instance.internChildren.size).toBe(1)
				expect(instance.internChildren.get('file.js' as UnifiedPathPart_string)?.toJSON()).toEqual(
					expected.get('file.js' as UnifiedPathPart_string)?.toJSON()
				)
			})

			test('not defined', () => {
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Root,
						engineModule: NodeModule.currentEngineModule().toJSON(),
						filePath: undefined,
						globalIndex: {
							currentId: 0,
							moduleMap: {}
						}
					},
					SourceFileMetaDataTreeType.Root,
					undefined
				)
				expect(instance.internChildren.size).toBe(0)
			})
		})

		describe('externChildren', () => {
			test('defined', () => {
				const globalIndex = new GlobalIndex(NodeModule.currentEngineModule())
				const expected = new ModelMap<
				NodeModuleIdentifier_string, SourceFileMetaDataTree<SourceFileMetaDataTreeType.Module>>('string')
				const moduleNode = new SourceFileMetaDataTree(
					SourceFileMetaDataTreeType.Module,
					undefined,
					globalIndex.getModuleIndex('upsert', 'package@1.0.1' as NodeModuleIdentifier_string)
				)
				
				moduleNode.internChildren.set('./file.js' as UnifiedPathPart_string,
					new SourceFileMetaDataTree(
						SourceFileMetaDataTreeType.File,
						new UnifiedPath('./file.js'),
						globalIndex.getModuleIndex('upsert', 'package@1.0.1' as NodeModuleIdentifier_string).getFilePathIndex('upsert', './file.js' as UnifiedPath_string)
					)
				)

				expected.set('package@1.0.1' as NodeModuleIdentifier_string, moduleNode)

				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Root,
						filePath: undefined,
						engineModule: NodeModule.currentEngineModule().toJSON(),
						externChildren: {
							['package@1.0.1' as NodeModuleIdentifier_string]: {
								engineModule: undefined,
								type: SourceFileMetaDataTreeType.Module,
								filePath: undefined,
								internChildren: {
									['./file.js' as UnifiedPathPart_string]: {
										engineModule: undefined,
										type: SourceFileMetaDataTreeType.File,
										filePath: new UnifiedPath('./file.js').toString(),
										globalIndex: undefined
									}
								},
								globalIndex: undefined
							}
						},
						globalIndex: {
							currentId: 2,
							moduleMap: {
								['package@1.0.1' as NodeModuleIdentifier_string]: {
									id: 0 as ModuleID_number,
									children: {
										'file.js': {
											id: 1 as PathID_number
										}
									}
								}
							}
						}
					},
					SourceFileMetaDataTreeType.Root,
					undefined
				)
				expect(instance.externChildren.size).toBe(1)
				expect(instance.externChildren.get('package@1.0.1' as NodeModuleIdentifier_string)?.toJSON()).toEqual(
					expected.get('package@1.0.1' as NodeModuleIdentifier_string)?.toJSON()
				)
			})

			test('not defined', () => {
				const instance = SourceFileMetaDataTree.fromJSON(
					{
						type: SourceFileMetaDataTreeType.Root,
						filePath: undefined,
						globalIndex: {
							currentId: 0,
							moduleMap: {}
						},
						engineModule: NodeModule.currentEngineModule().toJSON()
					},
					SourceFileMetaDataTreeType.Root,
					undefined
				)
				expect(instance.externChildren.size).toBe(0)
			})
		})
	})

	describe('loadFromFile', () => {
		describe('test case example001', () => {
			test('with compiled', () => {
				const projectReportPath = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.json')
				const projectReport = ProjectReport.loadFromFile(projectReportPath, 'json')

				if (projectReport === undefined) {
					throw new Error('SourceFileMetaDataTree.test.loadFromFile: could not load example001.oak.json')
				}
				const tree = SourceFileMetaDataTree.fromProjectReport(projectReport, 'compiled')

				const expectedSourceFileMetaDataTreePath = CURRENT_DIR.join('assets', 'SourceFileMetaDataTree', 'example001.compiled.json')
				if (UPDATE_TEST_REPORTS) {
					tree.storeToFile(expectedSourceFileMetaDataTreePath)
				}

				const expected = SourceFileMetaDataTree.loadFromFile(expectedSourceFileMetaDataTreePath)

				expect(tree.toJSON()).toEqual(expected?.toJSON())
			})

			test('with original', () => {
				const projectReportPath = CURRENT_DIR.join('assets', 'ProjectReport', 'example001.oak.json')
				const projectReport = ProjectReport.loadFromFile(projectReportPath, 'json')

				if (projectReport === undefined) {
					throw new Error('SourceFileMetaDataTree.test.loadFromFile: could not load example001.oak.json')
				}
				const tree = SourceFileMetaDataTree.fromProjectReport(projectReport, 'original')

				const expectedSourceFileMetaDataTreePath = CURRENT_DIR.join('assets', 'SourceFileMetaDataTree', 'example001.original.json')
				if (UPDATE_TEST_REPORTS) {
					tree.storeToFile(expectedSourceFileMetaDataTreePath)
				}

				const expected = SourceFileMetaDataTree.loadFromFile(expectedSourceFileMetaDataTreePath)

				expect(tree.toJSON()).toEqual(expected?.toJSON())
			})
		})

		describe('test case example002', () => {
			test('with compiled', () => {
				const expectedSourceFileMetaDataTreePath = CURRENT_DIR.join('assets', 'SourceFileMetaDataTree', 'example002.compiled.json')

				const projectReportPath = CURRENT_DIR.join('assets', 'ProjectReport', 'example002.oak.json')
				const projectReport = ProjectReport.loadFromFile(projectReportPath, 'json')

				if (projectReport === undefined) {
					throw new Error('SourceFileMetaDataTree.test.loadFromFile: could not load example002.oak.json')
				}

				const tree = SourceFileMetaDataTree.fromProjectReport(projectReport, 'compiled')
				if (UPDATE_TEST_REPORTS) {
					tree.storeToFile(expectedSourceFileMetaDataTreePath)
				}
				const expected = SourceFileMetaDataTree.loadFromFile(expectedSourceFileMetaDataTreePath)

				expect(tree.toJSON()).toEqual(expected?.toJSON())
			})

			test('with original', () => {
				const expectedSourceFileMetaDataTreePath = CURRENT_DIR.join('assets', 'SourceFileMetaDataTree', 'example002.original.json')

				const projectReportPath = CURRENT_DIR.join('assets', 'ProjectReport', 'example002.oak.json')
				const projectReport = ProjectReport.loadFromFile(projectReportPath, 'json')

				if (projectReport === undefined) {
					throw new Error('SourceFileMetaDataTree.test.loadFromFile: could not load example002.oak.json')
				}

				const tree = SourceFileMetaDataTree.fromProjectReport(projectReport, 'original')
				if (UPDATE_TEST_REPORTS) {
					tree.storeToFile(expectedSourceFileMetaDataTreePath)
				}
				const expected = SourceFileMetaDataTree.loadFromFile(expectedSourceFileMetaDataTreePath)

				expect(tree.toJSON()).toEqual(expected?.toJSON())
			})
		})

		test('non existing file', () => {
			expect(SourceFileMetaDataTree.loadFromFile(new UnifiedPath('./abc'))).toBeUndefined()
		})
	})
})
