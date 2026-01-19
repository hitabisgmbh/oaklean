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
#include "./md-configs/components/cli/01-select-sensorinterface.md"

### 2. Confirm the config generation
#include "./md-configs/components/cli/02-confirm.md"

##### Available Sensor Interfaces
#include "./md-configs/components/sensor-interface/01-overview.md"

## First Measurement

To perform your first measurement with Oaklean, simply import the profiler and wrap the code you want to measure. The basic structure looks like this:

### Javascript
#include "./md-configs/components/code-example/01-example-js.md"

### Typescript
#include "./md-configs/components/code-example/01-example-ts.md"

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

#include "./md-configs/components/links/vscode-extension-marketplace.md"

#### Import a measurement report
To view a report:
1. Open the `.oak` file in VS Code by right-clicking the `.oak` file and selecting **“Select Project/Module Report”**
2. The measurements will load, and you can explore them further by clicking the **Oaklean icon** in the sidebar.


For detailed guidance, see the <a href="https://github.com/hitabisgmbh/oaklean-vscode" target="_blank">Oaklean VS Code Extension Github page</a>