# `@oaklean/cli`

A command-line interface that provides utilities for parsing, inspecting, and converting the .oak file format, as well as interfaces used in the `@oaklean` suite.

## Usage

`$ npx oak -h`
```
Usage: oak [options] [command]

An CLI to interact with the @oaklean suite

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  config          commands to interact with a config file
     - resolve Resolves the given config file and outputs the resolved config (including all default values and overrides)
  
  init            Create a .oaklean config file
  report          commands to convert or inspect the profiler's format
     - toHash Calculates the hash of given a profiler format
     - toJSON Converts a profiler format that is given in binary format to a json version
     - toSourceFileTree Converts a profiler format that is given in binary format to a SourceFileMetaDataTree
     - check Checks wether all files in the profiler format are present
     - inspect Displays an overview of the reports stats
  
  profile         commands to convert or inspect the cpu profile's format
     - toCPUModel Converts a cpu profile format that is given to a cpu model format
     - inspect Displays an overview of the cpu profile stats
     - trace Displays the trace of the cpu profile
     - anonymize Converts all paths in the cpu profile to relative paths (relative to the rootDir mentioned in the .oaklean config) to remove all user related paths
  
  parse           commands to parse javascript or typescript files
     - toPST Converts a given javascript/typescript file and extracts the ProgramStructureTree from it and stores it into a file
  
  backend         commands to interact with the backend
     - send Sends a given .oak report to a backend specified in the .oaklean config
  
  jest            Commands to inspect the jest profiler format. This is mostly used for debugging purposes
     - verify Checks wether the accumulate report of the jest-test-environment would be generated the same way with this version
  
  help [command]  display help for command
```

## Fast Config Setup
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

## Development
To build the tool, execute npm run build.

To make the tool available on your system and enable the `oak` command, simply run `npm run setup`. This command not only builds the tool but also updates your system's version of `@oaklean/cli` to the newly built one.