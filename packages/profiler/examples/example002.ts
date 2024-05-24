import minifier from 'html-minifier'

import { Profiler } from '../src/index'

const profile = new Profiler('example002')

async function main() {
	const title = 'latest'
	await profile.start(title)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const result = minifier.minify('<style>* { font-size: 11px }</style><p title="blah" id="moo">foo</p>', {
		minifyCSS: true
	})

	await profile.finish(title)
}

main()