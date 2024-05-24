// eslint-disable-next-line no-useless-escape
const VALID_DATA_URL_REGEX = /^(data:)([\w\/\+-]*)((?:;charset=[\w-]+)?;base64){0,1},(.*)$/i

export class DataUrlUtils {
	static isDataUrl(s: string): boolean {
		return VALID_DATA_URL_REGEX.test((s || '').trim())
	}

	static parseDataUrl(s: string): string {
		if (!DataUrlUtils.isDataUrl(s)) {
			return '{}'
		}

		const parts = s.trim().match(VALID_DATA_URL_REGEX)

		if (parts === null || parts[3] === undefined || parts[4] === undefined) {
			return '{}'
		}

		const contentType = parts[3].slice(1)
		const content = parts[4]

		if (contentType !== 'base64' && contentType !== 'charset=utf-8;base64') {
			throw new Error(`DataUrlUtils.parseDataUrl: The Format ${contentType} is not supported`)
		}

		return Buffer.from(content, 'base64').toString('utf-8')
	}
}