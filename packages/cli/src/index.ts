#! /usr/bin/env node
import { program } from 'commander'

import { VERSION } from './constants/app'
import BackendCommands from './commands/BackendCommands'
import ReportCommands from './commands/ReportCommands'
import CPUProfileCommands from './commands/CPUProfileCommands'
import CodeParsingCommands from './commands/CodeParsingCommands'
import InitCommands from './commands/InitCommands'
import JestCommands from './commands/JestCommands'

program
	.version(VERSION)
	.description('An CLI to interact with the @oaklean suite')

InitCommands.init()
ReportCommands.init()
CPUProfileCommands.init()
CodeParsingCommands.init()
BackendCommands.init()
JestCommands.init()

program.configureHelp({
	subcommandDescription: (cmd) => {
		let commandTree = ''

		cmd.commands.forEach((command) => {
			const indentation = '  '
			const commandName = command.name()
			const commandDescription = command.description()

			commandTree += `${indentation} - ${commandName} ${commandDescription}\n`
		})

		return cmd.description() + '\n' + commandTree
	}
})

program.parse(process.argv)