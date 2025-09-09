import * as fs from 'fs'

import { BaseModel } from './BaseModel'

import { UnifiedPath } from '../system/UnifiedPath'
import { BufferHelper } from '../helper/BufferHelper'
// Types
import {
	NodeModuleIdentifier_string,
	INodeModule
} from '../types'

export const NodeModuleNameRegexString = '(?:@[a-z0-9-~][a-z0-9-._~]*\\/)?[a-z0-9-~][a-z0-9-._~]*'
// semver regular expression
// License: https://creativecommons.org/licenses/by/3.0/
// source: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// changes: all groups were converted to non-capturing groups
export const NodeModuleVersionRegexString = 
 
'(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-(?:(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+(?:[0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?'

export const NodeModuleIdentifierRegexString = `${NodeModuleNameRegexString}@${NodeModuleVersionRegexString}`
export const NodeModuleIdentifierRegex = new RegExp(NodeModuleIdentifierRegexString)

export const WASM_NODE_MODULE_IDENTIFIER = '{wasm}'

export class NodeModule extends BaseModel {
	name: string
	version: string

	constructor(
		name: string,
		version: string
	) {
		super()
		this.name = name
		this.version = version
	}

	static currentEngineModule(): NodeModule {
		return new NodeModule('node', process.versions.node)
	}

	get identifier(): NodeModuleIdentifier_string {
		return `${this.name}@${this.version}` as NodeModuleIdentifier_string
	}

	static fromIdentifier(identifier: NodeModuleIdentifier_string) {
		let name = ''
		let version = ''
		if (identifier[0] === '@') {
			[name, version] = identifier.slice(1).split('@')
			name = '@' + name
		} else {
			[name, version] = identifier.split('@')
		}
		if (
			(!name || !version) &&
			name !== WASM_NODE_MODULE_IDENTIFIER
		) {
			throw new Error('NodeModule.fromIdentifier: invalid format: ' + identifier)
		}

		return new NodeModule(name, version)
	}

	toJSON() {
		return {
			name: this.name,
			version: this.version,
		}
	}

	static fromJSON(json: string | INodeModule): NodeModule {
		let data: INodeModule
		if (typeof json === 'string') {
			data = JSON.parse(json)
		} else {
			data = json
		}

		const result = new NodeModule(data.name, data.version)
		return result
	}

	static fromNodeModulePath(path: UnifiedPath): NodeModule | undefined {
		const packageJsonPath: UnifiedPath = path.join('package.json')

		if (!fs.existsSync(packageJsonPath.toString())) {
			return undefined
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath.toString(), 'utf-8'))
		
		return new NodeModule(
			packageJson.name,
			packageJson.version
		)
	}

	toBuffer(): Buffer {
		const nameBuffer = BufferHelper.String2LToBuffer(this.name)
		const versionBuffer = BufferHelper.String2LToBuffer(this.version)

		return Buffer.concat([nameBuffer, versionBuffer])
	}

	static consumeFromBuffer(buffer: Buffer): {
		instance: NodeModule,
		remainingBuffer: Buffer
	} {
		const {
			instance: name,
			remainingBuffer: newRemainingBuffer
		} = BufferHelper.String2LFromBuffer(buffer)
		const {
			instance: version,
			remainingBuffer
		} = BufferHelper.String2LFromBuffer(newRemainingBuffer)

		return {
			instance: new NodeModule(name, version),
			remainingBuffer
		}
	}
}

export const WASM_NODE_MODULE = new NodeModule(WASM_NODE_MODULE_IDENTIFIER, '')