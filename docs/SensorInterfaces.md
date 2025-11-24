## Sensor Interfaces

### What are Sensor Interfaces?
Sensor interfaces are interfaces that help the Oaklean Profiler to obtain energy measurements from the system.

Currently, there are two sensor interfaces:
| SensorInterface | Operating System | Requires Root Privileges |
| --------------- | ---------------- | -------------------------|
| [powermetrics](#power-metrics-sensor-interface)    | macOS            | yes											|
| [perf](#perf-sensor-interface)            | linux            | yes<br><a href="#running-without-root-privileges">(read below to see<br> how it works<br> without root privileges)</a> |
| [windows](#windows-sensor-interface)			    | windows          | yes											|

> :warning: **Configure the Sensor Interface in the .oaklean.local config file**<br>
> We strongly recommend configuring the Sensor Interface in a dedicated `.oaklean.local` file, read here more about how and why: [Local Oaklean Config](Config.md#local-oaklean-config)

## Power Metrics Sensor Interface
`powermetrics` is a tool for macOS that provides detailed information about power consumption and energy use of the system, it comes **pre-installed** on macOS and can handle **Apple Silicon** and **Intel** machines.

It can be executed from command line with command:`powermetrics`

> :warning: **requires root priviliges**<br>
> Unfortunately `powermetrics` needs root priviliges and we haven't discovered a work around yet.

### How to use it?
In order to use the `powermetrics` Sensor Interface simple add this to the `.oaklean` or to the `.oaklean.local` config file in your project:
```json
// .oaklean
{
	...
	"runtimeOptions": {
		...
		"sensorInterface": {
			"type": "powermetrics",
			"options": {
				"sampleInterval": 100, // sample interval in microseconds
				"outputFilePath": "energy-measurements.plist"
			}
		}
		...
	},
	...
}
```
#### Docker support
> :hourglass_flowing_sand: **In Progress**<br>
We are currently working on a solution to make the powermetrics interface available within a docker container.


## Perf Sensor Interface
`perf` is a performance analysis tool for Linux that collects and analyzes performance and trace data. It helps in monitoring and profiling the performance of the entire system, including CPU, memory, and I/O activities. It is usually **not pre-installed** on Linux systems

#### How to install perf?

- Ubuntu
	`apt-get update && apt-get -y install linux-tools-generic`
- Debian
	`apt-get update && apt-get -y install linux-perf`
- Fedora/RedHat derivates
	`yum install -y perf`

> :point_up: **Other Linux Distributions**<br>
Remember, `perf` is available on various other Linux distributions as well. If you need installation instructions for a specific distribution not listed here, you can easily find them by searching online or referring to the documentation for your particular system!

### How to use it?
In order to use the `perf` Sensor Interface simple add this to the `.oaklean` or to the `.oaklean.local` config file in your project:
```json
// .oaklean
{
	...
	"runtimeOptions": {
		...
		"sensorInterface": {
			"type": "perf",
			"options": {
				"sampleInterval": 100, // sample interval in microseconds
				"outputFilePath": "energy-measurements.txt"
			}
		}
		...
	},
	...
}
```

#### Running without root privileges
Collecting energy measurements with `perf` without root privileges may result in an error like this:
```
You may not have permission to collect stats.
Consider tweaking /proc/sys/kernel/perf_event_paranoid:
 -1 - Not paranoid at all
	0 - Disallow raw tracepoint access for unpriv
	1 - Disallow cpu events for unpriv
	2 - Disallow kernel profiling for unpriv
```
So in order to allow perf to collect energy measurements without root privileges simple run:
`sudo sysctl -w kernel.perf_event_paranoid=-1`

#### Docker support
In order to use `perf` with docker you need to install perf on your host system and mount the kernel modules into your docker container:

Be aware that the service needs the **privileged** flag

```yml
# docker-compose.yml
version: '3'
services:
	service-name:
		image: # docker image here (needs to be the same kernel as the host system)
		volumes:
			- /lib/modules:/lib/modules
		privileged: true
```

## Windows Sensor Interface
The Windows Sensor Interface is a .NET binary developed for Oaklean. It uses the [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) library to access hardware sensors on Windows machines. This binary is included with the [@oaklean/windows-sensorinterface](/packages/windows-sensorinterface/README.md) package, which is automatically installed on Windows when you install the [@oaklean/profiler](/packages/profiler/README.md).

> :warning: **requires admin priviliges**<br>
> Unfortunately the `Windows Sensor Interface` needs admin priviliges and we haven't discovered a work around yet.
> To ensure correct permissions during measurement, we highly recommend opening a shell (e.g., PowerShell) with administrator privileges and running the measurement from there.

### How to use it?
In order to use the Windows Sensor Interface simple add this to the `.oaklean` or to the `.oaklean.local` config file in your project:
```json
// .oaklean
{
	...
	"runtimeOptions": {
		...
		"sensorInterface": {
			"type": "windows",
			"options": {
				"sampleInterval": 100, // sample interval in microseconds
				"outputFilePath": "energy-measurements.csv"
			}
		}
		...
	},
	...
}
```