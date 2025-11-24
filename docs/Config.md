## Config File
Oaklean uses a `.oaklean` config file that defines how measurements are taken, which sensor interface is used and where those measurements files are stored.

The `.oaklean` file needs to be stored in the root directory of the project to measure.

The schema of a `.oaklean` config file looks like this:

```json
// .oaklean
{
	"extends": ".oaklean.local",
	"projectOptions": {...},
	"exportOptions": {...},
	"runtimeOptions": {...},
	"registryOptions": {...}
}
```
**Only the project options are mandatory.**

## Local Oaklean Config
We strongly recommend configuring the Sensor Interface in a dedicated `.oaklean.local` file and then extending it from your main `.oaklean` configuration.

This approach allows you to exclude `.oaklean.local` from version control, so each developer can maintain their own machine-specific setup. This is especially useful when the same repository is used across different platforms (macOS, Windows, Linux), ensuring accurate and consistent measurements without forcing a shared configuration.

```json
// .oaklean
{
	"extends": ".oaklean.local",
	...
}
```

```json
// .oaklean.local
{
	"runtimeOptions": {
		"sensorInterface": {...}
	}
}
```

## Available options

<ul>
	<li><a href='#project-options'>Project Options</a></li>
	<li><a href='#export-options'>Export Options</a></li>
	<li><a href='#runtime-options'>Runtime Options</a></li>
	<li><a href='#registry-options'>Registry Options</a></li>
</ul>



### Project Options
```json
{
	...
	"projectOptions": {
		"identifier": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" // uuid
	}
	...
}
```
> :warning: **The project identifier:**<br>
> As you see above the config file always needs a project identifier, this is a uuid4 string that you can choose by yourself. This is necessary to clearly assign the measurement data to a project, which enables the analysis and comparison of measurement values over a development period.

### Export Options
Export options describe which measurement data should be exported and where should it be stored.

All attributes are optional, if not specified the default value is used:
```json
// default export options
{
	"exportOptions": {
		"outDir": 'profiles/',
		"outHistoryDir": 'profiles_history/',
		"rootDir": './',
		"exportV8Profile": false,
		"exportReport": true,
		"exportSensorInterfaceData": false
	}
}
```
All paths are relative to the directory the `.oaklean` file is stored, absolute paths are also supported.


Detailed description:
- **outDir** stores measurements (overwritten with each measurement)
- **outHistoryDir** stores measurements long-term (but only when using [@oaklean/profiler-jest-environment](../packages/profiler-jest-environment/README.md)). This enables comparison between measurements over a development period.
- **rootDir** defines where the root dir of the project is
- **exportV8Profile** when `true` the V8 cpuprofiler files that were used during the measurement are also exported
- **exportReport** when `true` the measurement report files are exported. `false` is only relevant if you use the profiler package within code and you store the report your self
- **exportSensorInterfaceData** when `true` all metric data files that were collected from the sensor interface are also exported

### Runtime Options
```json
// default runtime options
{
	"runtimeOptions": {
		"seeds": {},
		"v8": {
			"cpu": {
				"sampleInterval": 1
			}
		}
	},
}
```


Detailed description:
- **seeds**: set a seed for a random algorithm (currently only Math.random is supported) like this:
	```json
	{
		...
		"runtimeOptions": {
			..
			"seeds": {
				"Math.random": "0"
			}
			...
		}
		...
	}
	```
- **sensorInterface**: specify which sensor interface should be used. For further information read the [Sensor Interface Docs](SensorInterfaces.md)
	```json
	{
		...
		"runtimeOptions": {
			...
			"sensorInterface": {
				"type": "powermetrics",
				"options": {
					"sampleInterval": 100,
					"outputFilePath": "energy-measurements.data"
				}
			}
			...
		}
		...
	}
	```
- **v8**: specify the sample interval of the V8 profiler that is used for the measurement like this:
	```json
	{
		...
		"runtimeOptions": {
			...
			"v8": {
				"cpu": {
					"sampleInterval": 1
				}
			}
			...
		}
		...
	}
	```

### Registry Options

```json
// default registry options
{
	"registryOptions": {
		"url": "oaklean.io/project-report"
	}
}
```

Detailed description:
- **url**: Sets the registry the report should be uploaded to. Disable uploads in general by setting this url to an empty string.