# Prerequisites
- npm 10.2.4
- node 20.11.1

# Setup
1. Install dependencies: `npm ci`
2. Build: `npm run build`
3. Run tests: `npm run test`
4. Lint: `npm run lint`

# Tests
The profiler measures itself while its tests are executed.
To generate the measurements (stored in project reports) just execute the tests via `npm run test`

- Since the tests regarding the profiler format are deeply connected, it is often frustrating to update all the tests when changes to the profiler format are made. To solve this issue, there is the command npm run test-update. This will update all test assets to fit the tests. However, this command will only solve tests regarding the reading and writing of the profiler format. Therefore, it is important to ensure that the changes to the profiler format are serialized correctly. In most test files, there is a runInstanceTests method that will check if everything works as expected even after writing and reading a report again. So, as long as the feature is fully tested there, it should work with serialization and deserialization.

# Versioning
> **_NOTE:_** The versions of the profiler and the profiler-core package are always equal, there will be no release that only increases one package version

```
2.3.5
│ │ │
│ │ └───────── patch level / micro release
│ └─────────── minor release
└───────────── major release
```

- **build number**:
build number

- **patch level / micro release**:
includes bug fixes

- **minor release**:
includes new features

- **major release**:
includes significant changes (like breaking changes or fundamental changes)

## Backwards Compatibility

```
packages/profiler-core/src/model/BackwardsCompatibility
│ └───────── versionFormats
│             │ └─────────── ProjectReportFormat-00001-0.0.9
│             └───────────── ProjectReportFormat-00002-0.0.10
└─────────── versionTransformers
              └─────────── ProjectReportTransformer-00001-0.0.9
```

Since measurements are stored in a self developed format (ProjectReport) it is necessary to provide backwards compatibility for this format. Therefore each release (that changes the format) of the profiler-core should provide the new version format (including the changed types) and a transformer class which contains a static method `transform_projectReport` to transform the format of the last release to the new format.
