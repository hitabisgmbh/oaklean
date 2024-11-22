# `@oaklean/jest-profiler-environment`

Supports Jest versions 28 & 29
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
The `@oaklean/cli` can be used to easily setup a `.oaklean` config file.
1. Install the cli: `npm add --save-dev @oaklean/cli`
2. Run the init script: `npx oak init`
3. It will ask you which sensor interface should be used for energy measurements:
```
Select a sensor interface (recommended for your platform: perf)
  None (pure cpu time measurements)
  powermetrics (macOS only)
❯ perf (Linux only)
  windows (Windows only)
energy measurements on Linux (Intel & AMD CPUs only)
```
4. The cli asks you to confirm your choice and generates a valid `.oaklean` config file for you:
```
? Select a sensor interface (recommended for your platform: perf) perf (Linux only)
{
  "exportOptions": {
    "outDir": "profiles/",
    "outHistoryDir": "profiles_history/",
    "rootDir": "./",
    "exportV8Profile": false,
    "exportReport": true,
    "exportSensorInterfaceData": false
  },
  "projectOptions": {
    "identifier": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
  },
  "runtimeOptions": {
    "seeds": {},
    "v8": {
      "cpu": {
        "sampleInterval": 1
      }
    },
    "sensorInterface": {
      "type": "perf",
      "options": {
        "outputFilePath": "energy-measurements.txt",
        "sampleInterval": 100
      }
    }
  }
}
? Is this OK? (yes) (Y/n)
```
##### Available Sensor Interfaces

| SensorInterface | Operating System |
| --------------- | ---------------- |
| powermetrics		| macOS						 |
| perf						| linux						 |
| windows					| windows					 |

If you want to how to setup the Sensor Interfaces and how to make them work with **Docker** you can read more about it [here](/docs/SensorInterfaces.md)


> :warning: **Most Sensor Interfaces need root privileges**<br>
> Look into the [Sensor Interface Docs](/docs/SensorInterfaces.md) to see how you can run them without root privileges

> :mag: **How measurements work**<br>
> During the test execution measurements are collected with a sample based approach. So for every n - microseconds it collects a v8 cpu profile and energy measurements of the sensor interface. You can adjust the sampling rate with the `sampleInterval` options in the `.oaklean` config file above.

#### 4. Run the tests to collect energy measurements
> :warning: **The measurement data is NOT automatically collected**<br>
To enable measurements during test execution you must set an environment variable beforehand (ENABLE_MEASUREMENTS=1).
When running Jest tests with this environment variable, the measurement data should be saved in the specified output directory.

> :pinched_fingers: **For more accurate measurement results**<br>
It is mandatory to run Jest with the --runInBand option. This ensures that the tests are executed sequentially and not in different threads: npx jest --coverage --runInBand.

Execute the tests:
`ENABLE_MEASUREMENTS=1 npx jest --coverage --runInBand`

#### 5. Interpret the measurements and determine the source code locations with the most energy consumption

The `Oaklean` VSCode Extension lets you to interpret the measurements. It integrates the energy measurements directly into your IDE.

**You can find it here:**
- <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Github</a>
- <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">VS Code Extension</a>

It provides code highlighting to point out which source code locations consume the most energy:
<br>
![vscode-code-highlighting-img](https://github.com/hitabisgmbh/oaklean/blob/main/images/vscode-code-highlighting.png?raw=true)
<br>
It also provides multiple features to determine the components that consume the most energy, including node modules:
<br>
![vscode-explorer-img](https://github.com/hitabisgmbh/oaklean/blob/main/images/vscode-explorer.png?raw=true)