# `@oaklean/cli`

A command-line interface that provides utilities for parsing, inspecting, and converting the .oak file format, as well as interfaces used in the `@oaklean` suite.

## Usage

`$ oak -h`
```
Usage: oak [options] [command]

An CLI to interact with the @oaklean suite

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  format          commands to convert or inspect the profiler's format
     - toJSON Converts a profiler format that is given in binary format to a json version
     - toSourceFileTree Converts a profiler format that is given in binary format to a SourceFileMetaDataTree
  
  profile         commands to convert or inspect the cpu profile's format
     - toCPUModel Converts a cpu profile format that is given to a cpu model format
  
  parse           commands to parse javascript or typescript files
     - toPST Converts a given javascript/typescript file and extracts the ProgramStructureTree from it and stores it into a file
  
  transpile       commands to parse javascript or typescript files
     - withJest Transpiles a given javascript/typescript file with jest and stores the transpiled code into a file
     - withTS Transpiles a given javascript/typescript file with typescript and stores the transpiled code into a file
  
  backend         commands to interact with the backend
     - send Sends a given .oak report to a backend specified in the .oaklean config
  
  help [command]  display help for command
```

## Development
To build the tool, execute npm run build.

To make the tool available on your system and enable the `oak` command, simply run `npm run setup`. This command not only builds the tool but also updates your system's version of `@oaklean/cli` to the newly built one.