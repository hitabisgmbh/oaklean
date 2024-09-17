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