#! /usr/bin/env node
import { program } from 'commander'

import { VERSION } from './constants/app'
import BackendCommands from './commands/BackendCommands'
import FormatCommands from './commands/FormatCommands'
import CPUProfileCommands from './commands/CPUProfileCommands'
import CodeParsingCommands from './commands/CodeParsingCommands'

program
	.version(VERSION)
	.description('An CLI to interact with the @oaklean suite')

FormatCommands.init()
CPUProfileCommands.init()
CodeParsingCommands.init()
BackendCommands.init()

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