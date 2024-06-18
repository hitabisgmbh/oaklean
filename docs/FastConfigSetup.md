## Fast Config Setup
The `@oaklean/cli` can be used to easily setup a `.oaklean` config file.
1. Install the cli: `npm add --save-dev @oaklean/cli`
2. Run the init script: `oak init`
3. It will ask you which sensor interface should be used for energy measurements:
```
? Select a sensor interface (recommended for your platform: powermetrics) (Use arrow keys)
❯ None (pure cpu time measurements)
  powermetrics (macOS only)
  perf (Linux only)
pure cpu time measurements without energy measurements
```
4. The cli asks you to confirm your choice and generates a valid `.oaklean` config file for you:
```
? Select a sensor interface (recommended for your platform: powermetrics) perf (Linux only)
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