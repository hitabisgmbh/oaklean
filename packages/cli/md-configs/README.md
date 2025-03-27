# `@oaklean/cli`

A command-line interface that provides utilities for parsing, inspecting, and converting the .oak file format, as well as interfaces used in the `@oaklean` suite.

## Usage

`$ npx oak -h`
```
Usage: oak [options] [command]

An CLI to interact with the @oaklean suite

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init            Create a .oaklean config file
  report          commands to convert or inspect the profiler's format
     - toHash Calculates the hash of given a profiler format
     - toJSON Converts a profiler format that is given in binary format to a json version
     - toSourceFileTree Converts a profiler format that is given in binary format to a SourceFileMetaDataTree
     - check Checks wether all files in the profiler format are present
     - inspect Displays an overview of the reports stats
  
  profile         commands to convert or inspect the cpu profile's format
     - toCPUModel Converts a cpu profile format that is given to a cpu model format
     - inspect Displays an overview of the cpu profile stats
     - trace Displays the trace of the cpu profile
     - anonymize Converts all paths in the cpu profile to relative paths (relative to the rootDir mentioned in the .oaklean config) to remove all user related paths
  
  parse           commands to parse javascript or typescript files
     - toPST Converts a given javascript/typescript file and extracts the ProgramStructureTree from it and stores it into a file
  
  backend         commands to interact with the backend
     - send Sends a given .oak report to a backend specified in the .oaklean config
  
  help [command]  display help for command
```

## Fast Config Setup
#include "../../docs/FastConfigSetup.md"

## Development
To build the tool, execute npm run build.

To make the tool available on your system and enable the `oak` command, simply run `npm run setup`. This command not only builds the tool but also updates your system's version of `@oaklean/cli` to the newly built one.