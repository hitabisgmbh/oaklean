![oaklean-header](https://github.com/hitabisgmbh/oaklean/blob/main/images/oaklean-header.jpg?raw=true)

# `@oaklean/cli`
A command-line interface that provides utilities for parsing, inspecting, and converting the .oak file format, as well as interfaces used in the `@oaklean` suite.

## Table of Contents

- [Usage](#usage)
- [Fast Config Setup](#fast-config-setup)
- [Development](#development)
- [For More Information](#for-more-information)

## Usage

`$ npx oak -h`
```
Usage: oak [options] [command]

An CLI to interact with the @oaklean suite

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  config                commands to interact with a config file
     - resolve Resolves the given config file and outputs the resolved config (including all default values and overrides)

  init                  Create a .oaklean config file
  report                commands to convert or inspect the profiler's format
     - toHash Calculates the hash of given a profiler format
     - toJSON Converts a profiler format that is given in binary format to a json version
     - toSourceFileTree Converts a profiler format that is given in binary format to a SourceFileMetaDataTree
     - check Checks wether all files in the profiler format are present
     - inspect Displays an overview of the reports stats

  profile               commands to convert or inspect the cpu profile's format
     - toCPUModel Converts a cpu profile format that is given to a cpu model format
     - inspect Displays an overview of the cpu profile stats
     - trace Displays the trace of the cpu profile
     - anonymize Converts all paths in the cpu profile to relative paths (relative to the rootDir mentioned in the .oaklean config) to remove all user related paths

  parse                 commands to parse javascript or typescript files
     - toPST Converts a given javascript/typescript file and extracts the ProgramStructureTree from it and stores it into a file
     - verify-identifiers Parses all source files (.js, .ts, .jsx, .tsx) within a given path and verifies that all identifiers are valid and unique

  external-resource|er  commands to interact with external resource files (.resources.json)
     - verify-identifiers Parses all source files in all resource files within a given path and verifies that all identifiers are valid and unique
     - extract Extract a file from a resource file and stores it into a separate file

  backend               commands to interact with the backend
     - send Sends a given .oak report to a backend specified in the .oaklean config

  jest                  Commands to inspect the jest profiler format. This is mostly used for debugging purposes
     - verify Checks wether the accumulate report of the jest-test-environment would be generated the same way with this version
     - inspect-profiles Inspects all reports and cpu profiles in the jests output directory and verifies their consistency
     - verify-trees Checks all sub reports in the output directory for SourceFileMetaDataTree consistency

  metrics-data|md       commands to convert or inspect the metrics data collection format
     - show Displays the metrics data collection as a table

  help [command]        display help for command
```

## Fast Config Setup
#include "../../docs/FastConfigSetup.md"

## Development
To build the tool, execute npm run build.

To make the tool available on your system and enable the `oak` command, simply run `npm run setup`. This command not only builds the tool but also updates your system's version of `@oaklean/cli` to the newly built one.

## For More Information
#include "../../md-configs/components/links/all-links.md"