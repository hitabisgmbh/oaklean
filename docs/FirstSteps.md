<!-- TABLE OF CONTENTS -->
<details>
	<summary>Table of Contents</summary>
	<ol>
	 <li>
			<a href="#installation">Installation</a>
		</li>
		<li>
			<a href="#initialize-oaklean">Initialize Oaklean</a>
		</li>
		<li>
			<a href="#first-measurement">First Measurement</a>
		</li>
		<li>
			<a href="#visualize-the-measurements-in-vs-code">Visualize the measurements in VS Code</a>
		</li>
	</ol>
</details>

## First Steps

Welcome to Oaklean!
This guide will help you install, configure, and start using Oaklean in your project.

## Installation
Oaklean can be added to your project using your preferred package manager (pnpm currently not supported):

### npm
```bash
npm install @oaklean/profiler
```

### yarn
```bash
yarn install @oaklean/profiler
```

## Initialize Oaklean
After installation, initialize Oaklean in your project directory:
```bash
npx oak init
```

### 1. Select your Sensorinterface
```
Select a sensor interface (recommended for your platform: perf)
  None (pure cpu time measurements)
  powermetrics (macOS only)
❯ perf (Linux only)
  windows (Windows only)
energy measurements on Linux (Intel & AMD CPUs only)
```

### 2. Confirm the config generation
```
✔ Select a sensor interface (recommended for your platform: powermetrics) perf (Linux only)
[Oaklean] [Main Config]
{
  "extends": ".oaklean.local",
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
    }
  }
}
[Oaklean] [Local Config]
{
  "runtimeOptions": {
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

## First Measurement

To perform your first measurement with Oaklean, simply import the profiler and wrap the code you want to measure. The basic structure looks like this:

### Javascript
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

### Typescript
```typescript
// script.ts
import { Profiler } from '@oaklean/profiler'
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

### Running the Code
For basic CPU-time measurements, you can simply run:
- `node script.js`
- `npx tsx script.ts`

If you also want to measure energy consumption, you may need to run the script with administrator privileges, depending on your Sensor Interface. For details, see the [Sensor Interface Docs](/docs/SensorInterfaces.md)

### Where are the measurements
After running a script that uses Oaklean to measure your code, the results are exported to the `./profiles` directory by default. You can also configure a custom location in the `.oaklean` config under exportOptions -> outDir.
Measurement files have the `.oak` file extension.

## Visualize the measurements in VS Code
<img src="../images/vscode-code-highlighting.png" width="800px">

### Install the VS Code extension
To visualize and interpret your measurements, install the Oaklean extension for VS Code. You can download it from one of the following sources:

- <a href="https://marketplace.visualstudio.com/items?itemName=HitabisGmbH.oaklean" target="_blank">VS Code Extension - Visual Studio Marketplace</a>
- <a href="https://open-vsx.org/extension/HitabisGmbH/oaklean" target="_blank">VS Code Extension - Open VSX Registry</a>

#### Import a measurement report
To view a report:
1. Open the `.oak` file in VS Code by right-clicking the `.oak` file and selecting **“Select Project/Module Report”**
2. The measurements will load, and you can explore them further by clicking the **Oaklean icon** in the sidebar.


For detailed guidance, see the <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Oaklean VS Code Extension Github page</a>