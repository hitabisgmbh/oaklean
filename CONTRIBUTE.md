# How to Contribute

## Prerequisites
- npm 10.2.4
- node ^20.17.0

## Setup
1. Install dependencies: `npm ci --ignore-scripts`
2. Build: `npm run build`
3. Run tests: `npm run test`
4. Lint: `npm run lint`
5. Generate docs: `npm run generate-docs`

## Tests
The profiler measures itself while its tests are executed.
To generate the measurements (stored in project reports) execute the tests via `npm run test-measure`

- Since the tests regarding the profiler format are deeply connected, it is often frustrating to update all the tests when changes to the profiler format are made. To solve this issue, there is the command `npm run test-update`. This will update all test assets to fit the tests. However, this command will only solve tests regarding the reading and writing of the profiler format. Therefore, it is important to ensure that the changes to the profiler format are serialized correctly. In most test files, there is a runInstanceTests method that will check if everything works as expected even after writing and reading a report again. So, as long as the feature is fully tested there, it should work with serialization and deserialization.

## Versioning
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

> :warning: **Failing tests after version upgrade**<br> After a version upgrade, the tests will fail because all test assets contain the previous version number. To fix this, run `npm run test-update`. This command will update all test assets to contain the new version number. The tests may not pass during the execution of the `npm run test-update` script, but running `npm run test` again should display the tests as passed.

## Generate Docs
All README files are built via the `npm run generate-docs` command, which uses `markdown-include` to build the README files. To make changes to the README files, update the Markdown files in the `md-configs` directory and re-generate the docs with `npm run generate-docs`.

## Bugs
### Where to Find Known Issues
We’ll use GitHub Issues to track all public bugs. We’ll monitor reports closely and indicate whenever an internal fix is underway. Before opening a new issue, please check to see if the problem has already been reported.

### Reporting New Issues
The most effective way to help us fix your bug is to include a minimal reproducible example. Please share a public repository containing a runnable test case.

### Security Bugs
See [SECURITY.md](./SECURITY.md) for the safe disclosure of security bugs. With that in mind, please do not file public issues; go through the process outlined there.

## Credits
This project exists thanks to all the people who [contribute](https://github.com/hitabisgmbh/oaklean/graphs/contributors)

<a href="https://github.com/hitabisgmbh/oaklean/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hitabisgmbh/oaklean" />
</a>

## License
By contributing to Oaklean, you agree that your contributions will be licensed under its MIT license.