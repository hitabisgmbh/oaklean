import * as jsoncParser from 'jsonc-parser'

import { LoggerHelper } from './LoggerHelper'

import {
	get,
	replace,
	format,
	sort,
	getComment,
	setComment
} from '../../lib/aywson/index'

type ObjectPath<T, Prefix extends string[] = []> = {
	[K in keyof T]: K extends string
		? T[K] extends object | undefined
			? NonNullable<T[K]> extends object
				? [...Prefix, K] | ObjectPath<NonNullable<T[K]>, [...Prefix, K]>
				: [...Prefix, K]
			: [...Prefix, K]
		: never
}[keyof T]

export class JsoncHelper<T extends object> {
	private _commentedJsoncContent: string

	constructor(commentedJsoncContent: string) {
		this._commentedJsoncContent = commentedJsoncContent
	}

	toString() {
		return this.format()._commentedJsoncContent
	}

	toJSON(): T {
		return jsoncParser.parse(this._commentedJsoncContent)
	}

	updateJsoncContent(changes: T) {
		this._commentedJsoncContent = replace(
			this._commentedJsoncContent,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			changes as unknown as any
		)
		this.format()
		return this
	}

	sortKeys(options?: {
		comparator?: (a: string, b: string) => number
		deep?: boolean
	}) {
		this._commentedJsoncContent = sort(this._commentedJsoncContent, [], {
			comparator: options?.comparator,
			deep: options?.deep ?? true
		})
		this.format()
	}

	format() {
		this._commentedJsoncContent = format(this._commentedJsoncContent, {
			tabSize: 2,
			insertSpaces: false,
			eol: '\n'
		})
		return this
	}

	getCommentIfPossible(path: ObjectPath<T>) {
		return (
			getComment(
				this._commentedJsoncContent,
				path as unknown as (string | number)[]
			) ?? undefined
		)
	}

	setCommentIfPossible(path: ObjectPath<T>, comment: string) {
		if (
			get(
				this._commentedJsoncContent,
				path as unknown as (string | number)[]
			) !== undefined
		) {
			this._commentedJsoncContent = setComment(
				this._commentedJsoncContent,
				path as unknown as (string | number)[],
				comment
			)
			this.format()
		}
	}

	static highlightJsoncComments(jsoncContent: string) {
		return jsoncContent.replace(/\/\/\s*(.+)/g, (match, message) => {
			return LoggerHelper.successString(`// ${message}`)
		})
	}
}
