import * as fs from 'fs'

import { UnifiedPath } from '../../../../src/system/UnifiedPath'

const CURRENT_DIR = new UnifiedPath(__dirname)
const ProgramStructureTypes_DIR = CURRENT_DIR.join('ProgramStructureTypes')

type TestCase = {
	source: {
		path: UnifiedPath,
		content: string
	}
	expected: {
		path: UnifiedPath,
		content: string,
		object: object
	}
}

function loadTestCase(
	sourcePath: UnifiedPath,
	expectedPath: UnifiedPath
): TestCase {
	const expectedContent = fs.readFileSync(expectedPath.toPlatformString()).toString()

	return {
		source: {
			path: sourcePath,
			content: fs.readFileSync(sourcePath.toPlatformString()).toString()
		},
		expected: {
			path: expectedPath,
			content: expectedContent,
			object: JSON.parse(expectedContent)
		}
	}
}

export function updateTestCase(
	expected: Omit<TestCase['expected'], 'content'>,
	shouldUpdate: boolean
) {
	if (shouldUpdate) {
		fs.writeFileSync(
			expected.path.toPlatformString(),
			JSON.stringify(expected.object, null, '\t')
		)
	}
}

export const NESTED_DECLARATIONS_CASE: TestCase = loadTestCase(
	CURRENT_DIR.join('nestedDeclarations.js'),
	CURRENT_DIR.join('nestedDeclarations.js.expected.json')
)

export const EMIT_HELPER_PATH = CURRENT_DIR.join('EmitHelpers.js')