```javascript
// script.js
const { Profiler } = require('@oaklean/profiler')
const profile = new Profiler('profile-name')

async function main() {
  await profile.start('test')
  // code to measure
  for (let i = 0; i < 1e6; i++) {
	  Math.sqrt(i)
  }
  await profile.finish('test')
}
main()
```