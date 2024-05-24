## Sensor Interfaces

### What are Sensor Interfaces?
Sensor interfaces are interfaces that help the Oaklean Profiler to obtain energy measurements from the system.

Currently, there are two sensor interfaces:
| SensorInterface | Operating System | Requires Root Privileges |
| --------------- | ---------------- | -------------------------|
| powermetrics    | macOS            | yes											|
| perf            | linux            | yes<br><a href="#running-without-root-privileges">(read below to see<br> how it works<br> without root privileges)</a> |

## Power Metrics Sensor Interface
`powermetrics` is a tool for macOS that provides detailed information about power consumption and energy use of the system, it comes **pre-installed** on macOS and can handle **Apple Silicon** and **Intel** machines.

It can be executed from command line with command:`powermetrics`

> :warning: **requires root priviliges**<br>
> Unfortunately `powermetrics` needs root priviliges and we haven't discovered a work around yet.

### How to use it?
In order to use the `powermetrics` Sensor Interface simple add this to the `.oaklean` config file in your project:
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


## Perf Metrics Sensor Interface
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
In order to use the `perf` Sensor Interface simple add this to the `.oaklean` config file in your project:
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