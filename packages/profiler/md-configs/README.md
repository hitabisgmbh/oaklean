# `@oaklean/profiler`

A library to measure the energy consumption of your javascript/typescript code

## Usage

#### 1. Installation
`npm add @oaklean/profiler`

#### 2. Create a `.oaklean` config file

#include "../../docs/FastConfigSetup.md"

#### 3. Measure your code

- Option 1 (Code Injection):
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

	// IMPORTANT FOR WINDOWS: There is a known issue regarding the usage of windows, measurements are currently not reliably exported when the process receives a ctrl+c (SIGINT) signal. https://github.com/hitabisgmbh/oaklean/issues/3
	```

- Option 2 (Code wrapping):
	```typescript
	import { Profiler } from '@oaklean/profiler'
	const profile = new Profiler(true, 'profile-name')

	async function main() {
		await profile.start("<report-name>")
		// run the code to profile
		await profile.finish("<report-name>")
	}
	main()

	// If the resp. exports are enabled the profiler will automatically
	// export the measurements into the output directory (defined via the `.oaklean` config) `<rootDir>/<outDir>/<report-name>/`
	```

#### 4. Interpret the measurements and determine the source code locations with the most energy consumption

#include "../../docs/InterpretMeasurements.md"
