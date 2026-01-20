import { TypescriptParser } from '../../../src/helper/TypescriptParser'
import { UnifiedPath } from '../../../src/system/UnifiedPath'
// Types
import { ProgramStructureTreeType } from '../../../src/types'

describe('exports', () => {
	/*
		export = class {}
		transpiled to:
		module.exports = class {}

		This case:
		export = class {}
		export = class {}
		will throw, since the export can only be used once in a file

		BUT this case:
		module.exports = class {}
		module.exports = class {}
		will NOT throw, since it can be assigned multiple times

		so we should give them anonymous identifiers (like anonymous:0) instead of default,
		so both cases will have the same identifiers
	*/

	describe('module.exports', () => {
		const code = `
			module.exports = class ClassExpression {
				constructor(args: any) {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{classExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.ExportAssignment', () => {
		const code = `
			export = class ClassExpression {
				constructor(args: any) {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{classExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					}
				}
			})
		})
	})
})

describe('ts.SyntaxKind.VariableDeclaration', () => {
	const code = `
		const VariableDeclaration = class {
			constructor(args: any) {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:VariableDeclaration}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ReturnStatement', () => {
	const code = `
		const ReturnStatement = class {
			constructor(args: any) {
				return class {
					constructor(args: any) {}
				}
			}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:ReturnStatement}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration,
							children: {
								'{classExpression:(anonymous:0)}': {
									type: ProgramStructureTreeType.ClassExpression,
									children: {
										'{constructor:constructor}': {
											type: ProgramStructureTreeType.ConstructorDeclaration
										}
									}
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.PropertyAccessExpression', () => {
	const code = `
		;({} as any).x = class {
			constructor(args: any) {}
		}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.NewExpression', () => {
	const code = `
		new VariableDeclaration(class {
			constructor(args: any) {}
		})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ParenthesizedExpression', () => {
	describe('NewExpression', () => {
		const code = `
		new (class {
			constructor(args: any) {}
		})(0);
		new (class {
			constructor(args: any) {}
		})(0)
	`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{classExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					},
					'{classExpression:(anonymous:1)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					}
				}
			})
		})
	})

	describe('typeof', () => {
		const code = `
		typeof(class {
			constructor(args: any) {}
		});
		typeof(class {
			constructor(args: any) {}
		});
	`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{classExpression:(anonymous:0)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					},
					'{classExpression:(anonymous:1)}': {
						type: ProgramStructureTreeType.ClassExpression,
						children: {
							'{constructor:constructor}': {
								type: ProgramStructureTreeType.ConstructorDeclaration
							}
						}
					}
				}
			})
		})
	})
})

describe('ts.SyntaxKind.CallExpression', () => {
	const code = `
		Object.entries(class {
			constructor(args: any) {}
		})
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.PropertyAssignment', () => {
	const code = `
		const PropertyAssignment = {
			PropertyAssignment: class {
				constructor(args: any) {}
			}
		};
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{scope:(obj:PropertyAssignment)}': {
					type: ProgramStructureTreeType.ObjectLiteralExpression,
					children: {
						'{classExpression:PropertyAssignment}': {
							type: ProgramStructureTreeType.ClassExpression,
							children: {
								'{constructor:constructor}': {
									type: ProgramStructureTreeType.ConstructorDeclaration
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ArrayLiteralExpression', () => {
	const code = `
		const ArrayLiteralExpression = [class {
			constructor(args: any) {}
		}];
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ArrowFunction', () => {
	const code = `
		const fn = () => class {
			constructor(args: any) {}
		};
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{functionExpression:fn}': {
					type: ProgramStructureTreeType.FunctionExpression,
					children: {
						'{classExpression:(anonymous:0)}': {
							type: ProgramStructureTreeType.ClassExpression,
							children: {
								'{constructor:constructor}': {
									type: ProgramStructureTreeType.ConstructorDeclaration
								}
							}
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ConditionalExpression', () => {
	const code = `
		;undefined !== null ? class {
			constructor(args: any) {}
		} : class {
			constructor(args: any) {}
		};
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				},
				'{classExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.JsxExpression', () => {
	const code = `
		<div>{class ClassExpression {constructor(args: any) {}}}</div>
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code, 'TSX')

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{constructor:constructor}': {
							type: ProgramStructureTreeType.ConstructorDeclaration
						}
					}
				}
			}
		})
	})
})

describe('ts.SyntaxKind.ArrayBindingPattern', () => {
	const code = `
		const [ ArrayBindingPattern1 ] = [ class {} ]
		const [ ArrayBindingPattern2 ] = [ class {} ]
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:(anonymous:0)}': {
					type: ProgramStructureTreeType.ClassExpression
				},
				'{classExpression:(anonymous:1)}': {
					type: ProgramStructureTreeType.ClassExpression
				}
			}
		})
	})
})

describe('ClassExpression in Class', () => {
	describe('ts.SyntaxKind.PrivateIdentifier', () => {
		const code = `
			class ClassExpression {
				#private = class {}
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:#private}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.PropertyDeclaration', () => {
		const code = `
			class ClassExpression {
				PropertyDeclaration = class {};
				static PropertyDeclaration = class {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:PropertyDeclaration}': {
								type: ProgramStructureTreeType.ClassExpression
							},
							'{classExpression@static:PropertyDeclaration}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.FirstLiteralToken', () => {
		const code = `
			class ClassExpression {
				42 = class {};
				static 42 = class {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:(literal:92cfceb3)}': {
								type: ProgramStructureTreeType.ClassExpression
							},
							'{classExpression@static:(literal:92cfceb3)}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.BigIntLiteral', () => {
		const code = `
			class ClassExpression {
				42n = class {};
				static 42n = class {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:(literal:40a3fd3b)}': {
								type: ProgramStructureTreeType.ClassExpression
							},
							'{classExpression@static:(literal:40a3fd3b)}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})

	describe('ts.SyntaxKind.StringLiteral', () => {
		const code = `
			class ClassExpression {
				'StringLiteral' = class {};
				static 'StringLiteral' = class {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:(literal:7e2b9fea)}': {
								type: ProgramStructureTreeType.ClassExpression
							},
							'{classExpression@static:(literal:7e2b9fea)}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})

	describe(' ts.SyntaxKind.ComputedPropertyName', () => {
		const code = `
			const ComputedPropertyName = 'ComputedPropertyName'
			class ClassExpression {
				[ComputedPropertyName] = class {};
				static [ComputedPropertyName] = class {};
			}
		`

		test('expected identifier', () => {
			const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

			const hierarchy = pst.identifierHierarchy()

			expect(hierarchy).toEqual({
				type: ProgramStructureTreeType.Root,
				children: {
					'{class:ClassExpression}': {
						type: ProgramStructureTreeType.ClassDeclaration,
						children: {
							'{classExpression:(expression:34832631)}': {
								type: ProgramStructureTreeType.ClassExpression
							},
							'{classExpression@static:(expression:34832631)}': {
								type: ProgramStructureTreeType.ClassExpression
							}
						}
					}
				}
			})
		})
	})
})

describe('duplicates in code', () => {
	const code = `
	var cls = class {
		methodA() {}
	}
	var cls = class {
		methodB() {}
	}, cls = class {
		methodC() {}
	}

	const obj = {
		cls: class {},
		cls: class {}
	}

	const ComputedPropertyName = 'ComputedPropertyName'
	class ClassExpression {
		#private = class {}

		PropertyDeclaration = class {};
		static PropertyDeclaration = class {};
		[ComputedPropertyName] = class {};
		static [ComputedPropertyName] = class {};

		'StringLiteral' = class {};
		static 'StringLiteral' = class {};

		42 = class {};
		static 42 = class {};

		#private = class {}

		PropertyDeclaration = class {};
		static PropertyDeclaration = class {};
		[ComputedPropertyName] = class {};
		static [ComputedPropertyName] = class {};

		'StringLiteral' = class {};
		static 'StringLiteral' = class {};
		
		42 = class {};
		static 42 = class {};
	}
	`

	test('expected identifier', () => {
		const pst = TypescriptParser.parseSource(new UnifiedPath('test.ts'), code)

		const hierarchy = pst.identifierHierarchy()

		expect(hierarchy).toEqual({
			type: ProgramStructureTreeType.Root,
			children: {
				'{classExpression:cls}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{method:methodA}': {
							type: ProgramStructureTreeType.MethodDefinition
						}
					}
				},
				'{classExpression:cls:1}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{method:methodB}': {
							type: ProgramStructureTreeType.MethodDefinition
						}
					}
				},
				'{classExpression:cls:2}': {
					type: ProgramStructureTreeType.ClassExpression,
					children: {
						'{method:methodC}': {
							type: ProgramStructureTreeType.MethodDefinition
						}
					}
				},
				'{scope:(obj:obj)}': {
					type: ProgramStructureTreeType.ObjectLiteralExpression,
					children: {
						'{classExpression:cls}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:cls:1}': {
							type: ProgramStructureTreeType.ClassExpression
						}
					}
				},
				'{class:ClassExpression}': {
					type: ProgramStructureTreeType.ClassDeclaration,
					children: {
						'{classExpression:#private}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:PropertyDeclaration}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:PropertyDeclaration}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(expression:34832631)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(expression:34832631)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(literal:7e2b9fea)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(literal:92cfceb3)}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:#private:1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:PropertyDeclaration:1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:PropertyDeclaration:1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(expression:34832631):1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(expression:34832631):1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(literal:7e2b9fea):1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(literal:7e2b9fea):1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression:(literal:92cfceb3):1}': {
							type: ProgramStructureTreeType.ClassExpression
						},
						'{classExpression@static:(literal:92cfceb3):1}': {
							type: ProgramStructureTreeType.ClassExpression
						}
					}
				}
			}
		})
	})
})
