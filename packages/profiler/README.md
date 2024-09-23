# `@oaklean/profiler`

A library to measure the energy consumption of your javascript/typescript code

## Usage

#### 1. Installation
`npm add @oaklean/profiler`

#### 2. Create a `.oaklean` config file

The `@oaklean/cli` can be used to easily setup a `.oaklean` config file.
1. Install the cli: `npm add -g @oaklean/cli`
2. Run the init script: `oak init`
3. It will ask you which sensor interface should be used for energy measurements:
```
Select a sensor interface (recommended for your platform: perf)
  None (pure cpu time measurements)
  powermetrics (macOS only)
❯ perf (Linux only)
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

If you want to how to setup the Sensor Interfaces and how to make them work with **Docker** you can read more about it [here](/docs/SensorInterfaces.md)


> :warning: **Most Sensor Interfaces need root privileges**<br>
> Look into the [Sensor Interface Docs](/docs/SensorInterfaces.md) to see how you can run them without root privileges

> :mag: **How measurements work**<br>
> During the test execution measurements are collected with a sample based approach. So for every n - microseconds it collects a v8 cpu profile and energy measurements of the sensor interface. You can adjust the sampling rate with the `sampleInterval` options in the `.oaklean` config file above.

#### 3. Measure your code

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
