![oaklean-header](https://github.com/hitabisgmbh/oaklean/blob/main/images/oaklean-header.jpg?raw=true)

# `@oaklean/profiler`
A library to measure the energy consumption of your javascript/typescript code

## Table of Contents

- [Usage](#usage)
	- [Setup](#setup)
	- [Measure your code](#measure-your-code)
	- [Interpret the measurements](#interpret-the-measurements-and-determine-the-source-code-locations-with-the-most-energy-consumption)
- [For More Information](#for-more-information)

## Usage

### Setup
#include "../../docs/FastConfigSetup.md"

### Measure your code

- Option 1 (Code Injection):
	> :warning: On Windows, this feature is not fully supported yet.
	```typescript
	import { Profiler } from '@oaklean/profiler'
	async function main() {
		await Profiler.inject("<report-name>") // IMPORTANT: need the await
		// run the code to measure
	}
	main()

	// profiler stops and exports profile when applications stops or gets killed
	// If the resp. exports are enabled the profiler will automatically
	// export the measurements into the output directory (defined via the `.oaklean` config) `<rootDir>/<report-name>/<timestamp>/`
	```

- Option 2 (Code wrapping):
	```typescript
	import { Profiler } from '@oaklean/profiler'
	const profile = new Profiler('profile-name')

	async function main() {
		await profile.start("<report-name>")
		// run the code to profile
		await profile.finish("<report-name>")
	}
	main()

	// If the resp. exports are enabled the profiler will automatically
	// export the measurements into the output directory (defined via the `.oaklean` config) `<rootDir>/<outDir>/<report-name>/`
	```

### Interpret the measurements and determine the source code locations with the most energy consumption

#include "../../docs/InterpretMeasurements.md"

## For More Information
#include "../../md-configs/components/links/all-links.md"