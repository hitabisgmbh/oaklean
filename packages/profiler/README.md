# `@oaklean/profiler`

A library to measure the energy consumption of your javascript/typescript code

## Usage

#### 1. Installation
`npm add @oaklean/profiler`

#### 2. Create a `.oaklean` config file

Create a `.oaklean` config file in the projects root directory (it is a .json file, remove the comments)
```json
{
	"exportOptions": {
		"outDir": "profiles", // output directory of the measurement reports, relative to the .oaklean file
	},
	"projectOptions": {
		"identifier": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" // uuid4 identifier string (must be self generated)
	},
	"runtimeOptions": {
		"seeds": {
			"Math.random": "0" // (optional) seed the Math.random function to ensure deterministic behaviour during tests
		},
		"sensorInterface": {
			"type": "<name of the sensor interface>", // read below to see which one is suitable for you
			"options": {
				"sampleInterval": 100, // sample interval in microseconds
				"outputFilePath": "energy-measurements.data" // output file of the energy measurements
			}
		},
		"v8": {
			"cpu": {
				"sampleInterval": 1 // sample interval in microseconds
			}
		}
	}
}
```

##### Available Sensor Interfaces

| SensorInterface | Operating System |
| --------------- | ---------------- |
| powermetrics    | macOS            |
| perf            | linux            |

If you want to how to setup the Sensor Interfaces and how to make them work with **Docker** you can read more about it [here](../../docs/SensorInterfaces.md)


> :warning: **Most Sensor Interfaces need root privileges**<br>
> Look into the [Sensor Interface Docs](../../docs/SensorInterfaces.md) to see how you can run them without root privileges

> :mag: **How measurements work**<br>
> During the test execution measurements are collected with a sample based approach. So for every n - microseconds it collects a v8 cpu profile and energy measurements of the sensor interface. You can adjust the sampling rate with the `sampleInterval` options in the `.oaklean` config file above.

#### 3. Measure your code

- Option 1 (Code Injection):
	```typescript
	import { Profiler } from '@oaklean/profiler'
	Profiler.inject("<report-name>")
	// run the code to measure

	// profiler stops and exports profile when applications stops or gets killed
	// If the resp. exports are enabled the profiler will automatically
	// export the measurements into the output directory (defined via the `.oaklean` config) `<rootDir>/<outDir>/<report-name>/`
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

To make sense of the generated `.oak` files during the jest test measurements we highly recommend the VSCode extension named <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">Oaklean</a>

It provides code highlighting to point out which source code locations consume the most energy:
<br>
![vscode-code-highlighting-img](https://github.com/hitabisgmbh/oaklean/blob/main/images/vscode-code-highlighting.png?raw=true){width="800px"}
<br>
It also provides multiple features to determine the components that consume the most energy, including node modules:
<br>
![vscode-explorer-img](https://github.com/hitabisgmbh/oaklean/blob/main/images/vscode-explorer.png?raw=true){width="300px"}
<br>
- <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Github</a>
- <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">VS Code Extension</a>

