![oaklean-header](https://github.com/hitabisgmbh/oaklean/blob/main/images/oaklean-header.jpg?raw=true)

# `@oaklean/jest-profiler-environment`

A jest environment to collect energy measurements on source code level during test execution.

Supports Jest versions 28 & 29.

## Table of Contents

- [Usage](#usage)
	- [Installation](#installation)
	- [Configure Jest](#configure-jest)
	- [Configure Oaklean](#configure-oaklean)
	- [Collect Energy Measurements](#collect-energy-measurements)
	- [Interpret The Measurements](#interpret-the-measurements)
- [For More Information](#for-more-information)

## Usage

### Installation
`npm add --save-dev @oaklean/profiler-jest-environment`

### Configure Jest
Add the `@oaklean/jest-profiler-environment` to the jest config:<br>
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

### Configure Oaklean
#include "../../docs/FastConfigSetup.md"

### Collect Energy Measurements
> :warning: **The measurement data is NOT automatically collected**<br>
To enable measurements during test execution you must set an environment variable beforehand (ENABLE_MEASUREMENTS=1).
When running Jest tests with this environment variable, the measurement data should be saved in the specified output directory.

> :pinched_fingers: **For more accurate measurement results**<br>
It is mandatory to run Jest with the --runInBand option. This ensures that the tests are executed sequentially and not in different threads: npx jest --coverage --runInBand.

Execute the tests:
`ENABLE_MEASUREMENTS=1 npx jest --coverage --runInBand`

### Interpret The Measurements
#include "../../docs/InterpretMeasurements.md"

## For More Information
#include "../../md-configs/components/links/all-links.md"