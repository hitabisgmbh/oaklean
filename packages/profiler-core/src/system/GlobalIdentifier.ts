import {
	NodeModule,
	NodeModuleIdentifierRegexString
} from '../model/NodeModule'
import {
	SourceNodeIdentifierRegexString,
	LangInternalSourceNodeIdentifierRegexString,
	LangInternalPathRegex,
	LangInternalPathRegexString
} from '../constants/SourceNodeRegex'
import { UnifiedPath } from '../system/UnifiedPath'
import { UnifiedPathRegexString } from '../constants/UnifiedPathRegex'
// Types
import {
	LangInternalPath_string,
	SourceNodeIdentifier_string,
	GlobalSourceNodeIdentifier_string,
	NodeModuleIdentifier_string,
	UnifiedPath_string,
	IGlobalIdentifier
} from '../types'

export class GlobalIdentifier {
	nodeModule?: NodeModule
	path: UnifiedPath_string | LangInternalPath_string
	sourceNodeIdentifier: SourceNodeIdentifier_string

	constructor(
		path: UnifiedPath_string | LangInternalPath_string,
		sourceNodeIdentifier: SourceNodeIdentifier_string,
		nodeModule?: NodeModule,
	) {
		this.path = path
		this.sourceNodeIdentifier = sourceNodeIdentifier
		this.nodeModule = nodeModule
	}

	static regexString(): string {
		return `^(${NodeModuleIdentifierRegexString}|)` +
			`{(${UnifiedPathRegexString}|${LangInternalPathRegexString}|)}`
			+`(${SourceNodeIdentifierRegexString}|${LangInternalSourceNodeIdentifierRegexString})$`
	}

	static regex(): RegExp {
		return new RegExp(GlobalIdentifier.regexString()) 
	}

	toJSON(): IGlobalIdentifier {
		if (this.nodeModule) {
			return {
				nodeModule: this.nodeModule?.toJSON(),
				path: this.path,
				sourceNodeIdentifier: this.sourceNodeIdentifier
			}
		} else {
			return {
				path: this.path,
				sourceNodeIdentifier: this.sourceNodeIdentifier
			}
		}	
	}

	get identifier(): GlobalSourceNodeIdentifier_string {
		const path = this.path ? this.path : ''
		if (!this.nodeModule) {
			return `{${path}}${this.sourceNodeIdentifier}` as GlobalSourceNodeIdentifier_string
		} else {
			return (
				`${this.nodeModule.identifier}{${path}}${this.sourceNodeIdentifier}`
			) as GlobalSourceNodeIdentifier_string
		}
	}

	isLangInternal() {
		return GlobalIdentifier.isLangInternalPath(this.path)
	}

	static isLangInternalPath(path: string) {
		return path === '' || LangInternalPathRegex.test(path)
	}

	static fromIdentifier(
		identifier: GlobalSourceNodeIdentifier_string
	) : GlobalIdentifier {
		const matches = GlobalIdentifier.regex().exec(identifier)
		if (!matches) {
			throw new Error('GlobalIdentifier.fromIdentifier: invalid format: ' + identifier)
		}

		const nodeModuleIdentifier = matches[1]
		const path = matches[2]
		const sourceNodeIdentifier = matches[3]

		let preprocessedPath
		if (GlobalIdentifier.isLangInternalPath(path)) {
			preprocessedPath = path as LangInternalPath_string
		} else {
			preprocessedPath = new UnifiedPath(path).toString()
		}

		if (nodeModuleIdentifier === '') {
			return new GlobalIdentifier(
				preprocessedPath,
				sourceNodeIdentifier as SourceNodeIdentifier_string,
			)
		} else {
			return new GlobalIdentifier(
				preprocessedPath,
				sourceNodeIdentifier as SourceNodeIdentifier_string,
				NodeModule.fromIdentifier(nodeModuleIdentifier as NodeModuleIdentifier_string)
			)
		}
	}
}