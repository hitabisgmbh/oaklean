import { CPUProfileSourceLocation } from '../../../../src/helper/CPUProfile/CPUProfileSourceLocation'
import { UnifiedPath } from '../../../../src/system/UnifiedPath'
import { NodeModule } from '../../../../src/model/NodeModule'

// Types
import {
	SourceNodeIdentifier_string
} from '../../../../src/types'

function langInternalFunction(
	fileName: string,
	// index of the function in the file (0, 1, 2, ...)
	index: number
) {
	const functionName = `lang_internal_${fileName}_${index}`
	return new CPUProfileSourceLocation(
		undefined as any,
		undefined as any,
		{
			url: fileName,
			functionName: functionName,
			scriptId: '0',
			lineNumber: 0,
			columnNumber: 0
		}
	)
}

export const SOURCE_LOCATIONS_LANG_INTERNAL = {
	'default': langInternalFunction('default', 0),
	'libA-0': langInternalFunction('libA', 0),
	'libA-1': langInternalFunction('libA', 1),
	'libA-2': langInternalFunction('libA', 2),
	'libB-0': langInternalFunction('libB', 0),
	'libC-0': langInternalFunction('libC', 0),
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

const scriptIdMap = new Map<string, number>();
const scriptId = (name: string) => {
	let id = scriptIdMap.get(name);
	if (id === undefined) {
		// skip 0 since its used in lang_internal scope
		id = scriptIdMap.size + 1;
		scriptIdMap.set(name, id);
	}

	return id;
};

let globalSourceLocationIndex = 0;
function projectScopeDefaultFunction(
	fileName: string,
	// index of the function in the file (0, 1, 2, ...)
	index: number
) {
	const functionName = `projectFunction_${fileName}_${index}`
	const filePath =  `file:///Users/user/project/src/${fileName}.js`
	return Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		globalSourceLocationIndex++,
		{
			url: filePath,
			functionName: functionName,
			scriptId: scriptId(filePath).toString(),
			lineNumber: index*10,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath(`src/${fileName}.js`),
				functionIdentifier:
					`{function:${functionName}}` as SourceNodeIdentifier_string
			},
			functionIdentifierPresentInOriginalFile: true
		}
	})
}

function moduleScopeDefaultFunction(
	moduleName: string,
	fileName: string,
	// index of the function in the file (0, 1, 2, ...)
	index: number
) {
	const functionName = `moduleFunction_${fileName}_${index}`
	const filePath = `file:///Users/user/project/node_modules/${moduleName}/${fileName}.js`

	return Object.assign(new CPUProfileSourceLocation(
		undefined as any,
		globalSourceLocationIndex++,
		{
			url: filePath,
			functionName: functionName,
			scriptId: scriptId(filePath).toString(),
			lineNumber: 0,
			columnNumber: 0
		}
	), {
		resolved: {
			sourceNodeLocation: {
				relativeFilePath: new UnifiedPath(`${fileName}.js`),
				functionIdentifier: `{function:${functionName}}` as SourceNodeIdentifier_string
			},
			nodeModule: new NodeModule(moduleName, '1.0.0'),
			relativeNodeModulePath: new UnifiedPath(`node_modules/${moduleName}`),
			functionIdentifierPresentInOriginalFile: true
		}
	})
}

export const SOURCE_LOCATIONS_DEFAULT = {
	'project-fileA-0': projectScopeDefaultFunction('fileA', 0),
	'project-fileA-1': projectScopeDefaultFunction('fileA', 1),
	'project-fileA-2': projectScopeDefaultFunction('fileA', 2),
	'project-fileB-0': projectScopeDefaultFunction('fileB', 0),
	'project-fileC-0': projectScopeDefaultFunction('fileC', 0),
	'moduleA-fileA-0': moduleScopeDefaultFunction('moduleA', 'fileA', 0),
	'moduleA-fileA-1': moduleScopeDefaultFunction('moduleA', 'fileA', 1),
	'moduleA-fileA-2': moduleScopeDefaultFunction('moduleA', 'fileA', 2),
	'moduleA-fileB-0': moduleScopeDefaultFunction('moduleA', 'fileB', 0),
	'moduleA-fileC-0': moduleScopeDefaultFunction('moduleA', 'fileC', 0),
	'moduleB-fileA-0': moduleScopeDefaultFunction('moduleB', 'fileA', 0),
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