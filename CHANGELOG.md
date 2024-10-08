
# Change Log

## 0.1.4
### Improvement
- Types are now outsourced into separate files, enabling their usage in browser environments

### Added
- A SensorInterface for Windows to measure the energy consumption

## 0.1.3
### Added
- The .oak file format now stores which source files contain uncommitted changes
- The `@oaklean/cli` contains a new `init` command to easily setup a new `.oaklean` config file
- The SourceFileMetaDataTree now stores both the compiled and original source file paths. This enables the VS Code extension to switch between a compiled- and a original source file mode to display and open files.

### Improvements
- The README files in this repository are now generated via `markdown-include` to reduce redundant documentation

### Fixes
- The profiler now correctly detects whether a function is present in the original source code when running JavaScript files that were compiled with source maps
- Fixed a bug in the perf sensor interface that was preventing measurements [#2](https://github.com/hitabisgmbh/oaklean/issues/2)
- The profiler now handles paths with spaces correctly
- Measurements are now correctly exported using the profilers inject capability [#1](https://github.com/hitabisgmbh/oaklean/issues/1)

## 0.1.2
### Added
- Git commit timestamp is stored in .oak file format keep the order of measurements

## 0.1.1
### Fixes
- Config resolution (especially for windows)

### Breaking Changes
- .oak files now contain a magic number and their version at the begin of the file, this makes all .oak files from version 0.1.0 deprecated

## 0.1.0 - 2024-05-24
- 🎉 **First Public Release!** 🚀
- We are thrilled to announce that this version marks the official public debut of our project. After countless hours of development and refinement, it's finally ready for the world. Thank you for your support and we can't wait to see what you'll do with it!

## 0.0.20
### Added
- option to the export options `exportSensorInterfaceData` to enable export of the sensor interface measurements

### Breaking Changes
- renamed `exportCPUTime` to `exportReport` in the export options of the config file

## 0.0.19
### Breaking Changes
- renamed `executionDetails.unstagedChanges` to `executionDetails.uncommittedChanges` (since it tracks not committed changes)

### Added
- Support in binary format to support arbitrary many sensor values

### Fixes
- source map resolution works now for more encodings
- fixes the tests on windows machines

## 0.0.18
### Fixes
- works now with projects that are not tracked with git

## 0.0.16
### Added
- Backend commands to the cli package
- A SensorInterface that uses perf to measure the energy consumption
- Reports are now stored in a history directory to compare reports over a certain time frame
  - The history directory can be configured in the .oaklean config
- Added a origin attribute to the report format to store wether the report was generated during a jest test or as a pure measurement

### Breaking Changes
- In SensorValues: renamed energyConsumption to cpuEnergyConsumption
- Renamed the report format extension from .preport to .oak

## 0.0.15
### Added
- Support for the __awaiter function. Async methods that are compiled via the __awaiter function are now correctly accounted, the measurements are now correctly accounted to the original method rather than the compiled __awaiter function.
  - The Callback within an __awaiter function is now treated like the parent function (both are identified by the same identifier)
- All EmitHelpers (e.g. the __awaiter function) are now named correctly within the ProgramStructureTree rather than treated as an anonymous function
- The SourceFileMetaDataTree now supports lang_internal and extern
- The Project Report format stores the runTime info and a flag that indicated wether the report is accumulated or a pure measurement
- The V8 CPU Profiler sampling interval is now configurable
- Added a code parse command to the cli to easy generate a ProgramStructureTree from a given Javascript/Typescript file
- SourceNodes contain a flag that indicates wether the SourceNode exists in the original SourceFile or only in the compiled one

### Fixes
- Measurements are now accounted correctly (energy values were not correctly accumulated)
- ProfilerHits are now calculated correctly
- Fix how measurements were accounted when an external library executes intern code

### Breaking Changes
- The SourceNodeIdentifier category: "arrowFunction" is now replaced with "functionExpression" since FunctionExpressions and ArrowFunctionExpression are very similar and arrow functions are often compiled into FunctionExpressions

### Improvements
- Refactored some code in the ProjectReport format to simplify future changes
- Added a normalize Method to the ProjectReport format to simplify test modifications

## 0.0.14
### Added
- A CLI tool to convert or inspect the profiler format and the v8 cpu profiler format

### Fixes
- Add a solution to handle minor negative cpu times in the v8 profiler format
- The original source code will receive credit for the measurements if it is executed by an external module

## 0.0.13 - 2024-02-12
### Added
- There is now a package called @oaklean/profiler-jest-environment that includes everything to run the profiler while running tests (using jest)
- The Project Report format can now be stored in a binary format to reduce its file size

### Fixes
- minor fixes in the profiler that affected the resolution of the relative directory stored in the Project Report Format

### Breaking Changes
- The Project Report Format was redesigned to decrease its file size, this included the following changes
  - all paths and source node identifiers are now stored within an index rather than stored as pure string

## 0.0.12 - 2024-01-22
### Added
- The typescript config of the project is now resolved dynamically
- ProjectReport accepts custom projectMetaData on initialization
- Support for empty Paths in GlobalIdentifier
- Add the SystemInformation Model and include it in the ProjectReport

### Fixes
- Fix the GitHelper for Windows systems
- Increased the Robustness of the PowerMetrics SensorInterface
- Fix validation check in the ProjectReport and fix minor issues in the regular expressions for identifiers

### Breaking Changes
- Regular Expressions were previously stored encapsulated in a SourceNodeIdentifier, the are now handled independently
	```
	{path/to/file}{root}{RegExp: \\/+$}
	will now be stored as:
	{path/to/file}{root}RegExp: \\/+$
	```

## 0.0.11 - 2024-01-03
### Added
- Added a general sensor interface class as base class for all types of energy measurements
- Support for the powermetrics tool (on Mac) as a source of energy measurements.
  - Added a sensor interface that collects energy measurements for all processes
- The SensorValues object can now store energyConsumption values, like the cpu time they are categorized by:
  **self**, **aggregated**, **langInternal**, **intern** and **extern**

### Breaking Changes
- The Profiler.start Method is now asynchronous and must be called with await to start the profiling
- Some Methods in the Report class from the profiler-core were replaced:
  - These methods take a new value argument to combine cpu time and power consumption
    - addCPUTimeToLangInternal -> addSensorValuesToLangInternal
    - addCPUTimeToIntern -> addSensorValuesToIntern
    - addCPUTimeToExtern -> addSensorValuesToExtern
  - getCPUTimeFromFile -> getMetaDataFromFile
  - totalAndMaxCPUTime -> totalAndMaxMetaData
- Some Methods in the SourceNodeMetaData class were replaced:
  - These methods take a new value argument to combine cpu time and power consumption
    - addToCPUTime -> addToSensorValues
    - addCPUTimeToLangInternal -> addSensorValuesToLangInternal
    - addCPUTimeToIntern -> addSensorValuesToIntern
    - addCPUTimeToExtern -> addSensorValuesToExtern
  

## 0.0.10 - 2023-11-06

### Added
- Transformer Adapters now require a method called `shouldProcess` which returns wether a given sourceFile path should be transformed
- Support for older ProjectReport formats by adding a ProjectReportTransformer that transforms older ProjectReport formats to newer ones

### Breaking Changes
- All variables and methods that used `node` as a prefix like `nodeInternal` use now the prefix `lang` like `langInternal`
- All variables and methods that used the suffix `usage` in order to specify the cpu usage use now the suffix `CPUTime`
- The profiler config format changed:
the `exportCPUUsage` is now called `exportCPUTime`
- The project reports format changed:
The measurements that were previously stored on a SourceNode are now stored in a nested attribute of that SourceNode that is called `sensorValues`:
Also the names of the measurement attributes have changed:

```
hits -> profilerHits
selfTime -> selfCPUTime
aggregatedTime -> aggregatedCPUTime
nodeInternalTime -> langInternalCPUTime
internTime -> internCPUTime
externTime -> externCPUTime
```

```typescript
// Before: 

type CPUUsageOfSourceNode = {
	selfTime: number,
	aggregatedTime: number
}

interface ISourceNodeMetaData extends CPUUsageOfSourceNode {
	type: SourceNodeMetaDataType
	hits: number
	nodeInternalTime?: number,
	internTime?: number,
	externTime?: number,
	node_internal?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	intern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	extern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
}

// After:

interface IPureCPUTime {
	selfCPUTime?: number,
	aggregatedCPUTime?: number
}

interface ISensorValues extends IPureCPUTime {
	profilerHits?: number
	internCPUTime?: number
	externCPUTime?: number
	langInternalCPUTime?: number
}

interface ISourceNodeMetaData {
	type: SourceNodeMetaDataType
	sensorValues: ISensorValues
	lang_internal?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	intern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
	extern?: Record<GlobalSourceNodeIdentifier_string, ISourceNodeMetaData>
}


```

### Internal Improvements
- Improves error reporting regarding the traversal of abstract syntax trees

### Bug fixes
- The JestAdapter did not transform all SourceFiles that Jest changes to provide a coverage report.
- There was a potential endless loop if the compiled source code included code that was not part of the original code (this happened e.g. when Jest extends the original source code with coverage code)

 