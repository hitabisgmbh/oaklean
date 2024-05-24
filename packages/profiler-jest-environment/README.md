# `@oaklean/jest-profiler-environment`

A jest environment to collect energy measurements on source code level during test execution.

## Usage

#### 1. Installation
`npm add --save-dev @oaklean/profiler-jest-environment`

#### 2. Add the `@oaklean/jest-profiler-environment` to the jest config

Adjust the jest config like this:
```javascript
module.exports = {
	...
	testEnvironment: '@oaklean/profiler-jest-environment/env.js', // add this line
	globalSetup: '@oaklean/profiler-jest-environment/setup.js', // add this line
	globalTeardown: '@oaklean/profiler-jest-environment/teardown.js', // add this line
	...
}
```

#### 3. Create a `.oaklean` config file

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
| powermetrics		| macOS						 |
| perf						| linux						 |

If you want to how to setup the Sensor Interfaces and how to make them work with **Docker** you can read more about it [here](../../docs/SensorInterfaces.md)


> :warning: **Most Sensor Interfaces need root privileges**<br>
> Look into the [Sensor Interface Docs](../../docs/SensorInterfaces.md) to see how you can run them without root privileges

> :mag: **How measurements work**<br>
> During the test execution measurements are collected with a sample based approach. So for every n - microseconds it collects a v8 cpu profile and energy measurements of the sensor interface. You can adjust the sampling rate with the `sampleInterval` options in the `.oaklean` config file above.


#### 4. Run the tests to collect energy measurements
> :warning: **The measurement data is NOT automatically collected**<br>
To enable measurements during test execution you must set an environment variable beforehand (ENABLE_MEASUREMENTS=1).
When running Jest tests with this environment variable, the measurement data should be saved in the specified output directory.

> :pinched_fingers: **For more accurate measurement results**<br>
It is recommended to run Jest with the --runInBand option. This ensures that the tests are executed sequentially and not in different threads: npx jest --coverage --runInBand.

Execute the tests:
`ENABLE_MEASUREMENTS=1 npx jest --coverage --runInBand`

#### 5. Interpret the measurements and determine the source code locations with the most energy consumption

To make sense of the generated `.oak` files during the jest test measurements we highly recommend the VSCode extension named <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">Oaklean</a>

It provides code highlighting to point out which source code locations consume the most energy:
<br>
<object data="https://raw.githubusercontent.com/hitabisgmbh/oaklean/main/images/vscode-code-highlighting.png" type="image/png" width="800px">
	<img src="../../images/vscode-code-highlighting.png" width="800px">
</object>
<br>
It also provides multiple features to determine the components that consume the most energy, including node modules:
<br>
<object data="https://raw.githubusercontent.com/hitabisgmbh/oaklean/main/images/vscode-explorer.png" type="image/png" width="300px">
	<img src="../../images/vscode-explorer.png" width="300px">
</object>
<br>

- <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Github</a>
- <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">VS Code Extension</a>