import { Profiler } from '../src/index'

const profile = new Profiler('example001')

function logMessage(message: string) {
	console.log(message)
}

function load() {
	for (let i = 0; i < 100000; i++) {
		logMessage(i.toString())
	}
}

async function main() {
	const title = 'latest'
	await profile.start(title)

	load()

	logMessage('outside of main')

	setTimeout(() => {
		console.log('finish')
	}, 1000)
	await profile.finish(title)
}

main()