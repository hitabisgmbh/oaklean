import { CPUProfileSourceLocation } from '../../../../src/helper/CPUProfile/CPUProfileSourceLocation'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
import { NodeModule } from '../../../../src/model/NodeModule'

// Types
import {
	SourceNodeIdentifier_string
} from '../../../../src/types'

export const SOURCE_LOCATIONS_LANG_INTERNAL = {
	'default': new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: '',
			functionName: '',
			scriptId: '0',
			lineNumber: 0,
			columnNumber: 0
		}
	)
}

export const SOURCE_LOCATIONS_WASM = {
	'default': new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'wasm://wasm/0x12345',
			functionName: 'wasm-function[42]:0x12345',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	)
}

export const SOURCE_LOCATIONS_WEBPACK = {
	'project-index-0': Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'webpack://./src/index.js',
			functionName: 'myFunction',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath('./src/index.js'),
				functionIdentifier: '{function:myFunction}' as SourceNodeIdentifier_string
			},
			functionIdentifierPresentInOriginalFile: true
		}
	}),
	'moduleA-index-0': Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'webpack://./node_modules/moduleA/index.js',
			functionName: 'moduleFunction',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath('./index.js'),
				functionIdentifier:
					'{function:moduleFunction}' as SourceNodeIdentifier_string
			},
			functionIdentifierPresentInOriginalFile: true,
			nodeModule: new NodeModule('moduleA', '1.0.0'),
			relativeNodeModulePath: new UnifiedPath('./node_modules/moduleA')
		}
	})
}

export const SOURCE_LOCATIONS_DEFAULT = {
	'project-index-0': Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'file:///Users/user/project/src/index.js',
			functionName: 'myFunction',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath('src/index.js'),
				functionIdentifier:
					'{function:myFunction}' as SourceNodeIdentifier_string
			},
			functionIdentifierPresentInOriginalFile: true
		}
	}),
	'project-index-1': Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'file:///Users/user/project/src/index.js',
			functionName: 'myFunction2',
			scriptId: '1',
			lineNumber: 10,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath('src/index.js'),
				functionIdentifier:
					'{function:myFunction2}' as SourceNodeIdentifier_string
			},
			functionIdentifierPresentInOriginalFile: true
		}
	}),
	'moduleA-index-0': Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: 'file:///Users/user/project/node_modules/moduleA/index.js',
			functionName: 'moduleFunction',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath('index.js'),
				functionIdentifier:
					'{function:moduleFunction}' as SourceNodeIdentifier_string
			},
			nodeModule: new NodeModule('moduleA', '1.0.0'),
			relativeNodeModulePath: new UnifiedPath('node_modules/moduleA'),
			functionIdentifierPresentInOriginalFile: true
		}
	})
}

export const SOURCE_LOCATIONS_EMPTY = {
	'default': new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: '',
			functionName: '',
			scriptId: '1',
			lineNumber: 0,
			columnNumber: 0
		}
	)
}