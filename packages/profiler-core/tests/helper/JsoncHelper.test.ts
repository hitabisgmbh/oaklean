import { JsoncHelper } from '../../src/helper/JsoncHelper'

describe('JsoncHelper', () => {
	test('toJSON and toString work as expected', () => {
		const content = `{
	// Comment for key
	"key": "value"
}`

		const jsonc = new JsoncHelper<{ key: string }>(content)

		const parsed = jsonc.toJSON()
		expect(parsed).toEqual({ key: 'value' })

		const str = jsonc.toString()
		expect(str).toEqual(content)
	})

	describe('comment retrieval', () => {
		test('getCommentIfPossible retrieves existing comment', () => {
			const content = `{
	// Comment for key
	"key": "value"
}`

			const jsonc = new JsoncHelper<{ key: string }>(content)

			const comment = jsonc.getCommentIfPossible(['key'])
			expect(comment).toEqual('Comment for key')
		})

		test('getCommentIfPossible returns undefined for non-existing comment', () => {
			const content = `{
	"key": "value"
}`

			const jsonc = new JsoncHelper<{ key: string }>(content)

			const comment = jsonc.getCommentIfPossible(['key'])
			expect(comment).toBeUndefined()
		})
	})

	describe('comment setting', () => {
		test('setCommentIfPossible sets comment correctly', () => {
			const content = `{
	"key": "value"
}`

			const expectedContent = `{
	// New comment for key
	"key": "value"
}`

			const jsonc = new JsoncHelper<{ key: string }>(content)
			jsonc.setCommentIfPossible(['key'], 'New comment for key')

			const str = jsonc.toString()
			expect(str).toEqual(expectedContent)
		})

		test('setCommentIfPossible does not set comment for non-existing property', () => {
			const content = `{
	"key": "value"
}`

			const expectedContent = `{
	"key": "value"
}`

			const jsonc = new JsoncHelper<{ key: string }>(content)
			jsonc.setCommentIfPossible(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				['nonExistingKey'] as any,
				'Comment for non-existing key'
			)

			const str = jsonc.toString()
			expect(str).toEqual(expectedContent)
		})
	})

	describe('keep comments for', () => {
		test('single property update', () => {
			const content = `{
	// Comment for key
	"key": ""
}`
			const expectedContent = `{
	// Comment for key
	"key": "value"
}`
			const data = {
				key: 'value'
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('multiple property updates', () => {
			const content = `{
	// Comment for key1
	"key1": "",
	// Comment for key2
	"key2": 0
}`
			const expectedContent = `{
	// Comment for key1
	"key1": "value1",
	// Comment for key2
	"key2": 42
}`
			const data = {
				key1: 'value1',
				key2: 42
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested property update', () => {
			const content = `{
	// Comment for nested
	"nested": {
		// Comment for innerKey
		"innerKey": 0
	}
}`
			const expectedContent = `{
	// Comment for nested
	"nested": {
		// Comment for innerKey
		"innerKey": 42
	}
}`
			const data = {
				nested: {
					innerKey: 42
				}
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested property addition', () => {
			const content = `{
	// Comment for nested
	"nested": {
		// Comment for innerKey
	}
}`
			const expectedContent = `{
	// Comment for nested
	"nested": {
		"innerKey": 42
		// Comment for innerKey
	}
}`
			const data = {
				nested: {
					innerKey: 42
				}
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})
	})

	describe('does not keep comments for', () => {
		test('array property update', () => {
			const content = `{
	// Comment for arrayKey
	"arrayKey": [
		// Comment for first element
		"",
		// Comment for second element
		""
	]
}`
			const expectedContent = `{
	// Comment for arrayKey
	"arrayKey": [
		"value1",
		"value2"
	]
}`
			const data = {
				arrayKey: ['value1', 'value2']
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested array addition', () => {
			const content = `{
	// Comment for arrayKey
	"arrayKey": [
		// Comment for first element
	]
}`
			const expectedContent = `{
	// Comment for arrayKey
	"arrayKey": [
		"value1",
		"value2"
	]
}`
			const data = {
				arrayKey: ['value1', 'value2']
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested array deletion', () => {
			const content = `{
	// Comment for arrayKey
	"arrayKey": [
		// Comment for first element
		"value1",
		// Comment for second element
		"value2"
	]
}`
			const expectedContent = `{
	// Comment for arrayKey
	"arrayKey": []
}`
			const data = {
				arrayKey: []
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested array update', () => {
			const content = `{
	// Comment for nestedArray
	"nestedArray": [
		// Comment for first element
		[
			// Comment for innerKey
			""
		],
		// Comment for second element
		[
			// Comment for innerKey
			""
		]
	]
}`
			const expectedContent = `{
	// Comment for nestedArray
	"nestedArray": [
		[
			"value1"
		],
		[
			"value2"
		]
	]
}`
			const data = {
				nestedArray: [['value1'], ['value2']]
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested array property update', () => {
			const content = `{
	// Comment for nestedArray
	"nestedArray": [
		// Comment for first object
		{
			// Comment for innerKey
			"key": ""
		},
		// Comment for second object
		{
			// Comment for innerKey
			"key": ""
		}
	]
}`
			const expectedContent = `{
	// Comment for nestedArray
	"nestedArray": [
		{
			"key": "value1"
		},
		{
			"key": "value2"
		}
	]
}`
			const data = {
				nestedArray: [
					{
						key: 'value1'
					},
					{
						key: 'value2'
					}
				]
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('nested property deletion', () => {
			const content = `{
	// Comment for nested
	"nested": {
		// Comment for innerKey
		"innerKey": 42
	}
}`
			const expectedContent = `{
	// Comment for nested
	"nested": {}
}`
			const data = {
				nested: {}
			}

			const jsonc = new JsoncHelper(content)
			jsonc.updateJsoncContent(data)

			const parsed = jsonc.toJSON()
			expect(parsed).toEqual(data)
			expect(jsonc.toString()).toEqual(expectedContent)
		})
	})

	describe('sortKeys', () => {
		test('sorts keys alphabetically', () => {
			const content = `{
	"bKey": "value",
	"aKey": "value"
}`

			const expectedContent = `{
	"aKey": "value",
	"bKey": "value"
}`

			const jsonc = new JsoncHelper(content)
			jsonc.sortKeys()

			expect(jsonc.toString()).toEqual(expectedContent)
		})

		test('sorts keys with custom comparator', () => {
			const content = `{
	"bKey": "value",
	"aKey": "value"
}`

			const expectedContent = `{
	"bKey": "value",
	"aKey": "value"
}`

			const jsonc = new JsoncHelper(content)
			jsonc.sortKeys({
				comparator: (a, b) => {
					if (a === 'bKey') return -1
					if (b === 'bKey') return 1
					return a.localeCompare(b)
				}
			})

			expect(jsonc.toString()).toEqual(expectedContent)
		})
	})
})
