# `@oaklean/jest-profiler-environment`

A jest environment to collect energy measurements on source code level during test execution.

Supports Jest versions 28 & 29.

## Usage

#### 1. Installation
`npm add --save-dev @oaklean/profiler-jest-environment`

#### 2. Add the `@oaklean/jest-profiler-environment` to the jest config

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

#### 3. Create a `.oaklean` config file
#include "../../docs/FastConfigSetup.md"

#### 4. Run the tests to collect energy measurements
> :warning: **The measurement data is NOT automatically collected**<br>
To enable measurements during test execution you must set an environment variable beforehand (ENABLE_MEASUREMENTS=1).
When running Jest tests with this environment variable, the measurement data should be saved in the specified output directory.

> :pinched_fingers: **For more accurate measurement results**<br>
It is mandatory to run Jest with the --runInBand option. This ensures that the tests are executed sequentially and not in different threads: npx jest --coverage --runInBand.

Execute the tests:
`ENABLE_MEASUREMENTS=1 npx jest --coverage --runInBand`

#### 5. Interpret the measurements and determine the source code locations with the most energy consumption

#include "../../docs/InterpretMeasurements.md"