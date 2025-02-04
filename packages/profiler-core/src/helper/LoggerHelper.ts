import util from 'util'

import cli from 'cli-color'

export class LoggerHelper {
	static logString(message?: any, ...optionalParams: any[]) {
		return cli.white(util.format.apply(this, [message, ...optionalParams]))
	}

	static warnString(message?: any, ...optionalParams: any[]) {
		return cli.yellow(util.format.apply(this, [message, ...optionalParams]))
	}

	static errorString(message?: any, ...optionalParams: any[]) {
		return cli.red(util.format.apply(this, [message, ...optionalParams]))
	}

	static successString(message?: any, ...optionalParams: any[]) {
		return cli.green(util.format.apply(this, [message, ...optionalParams]))
	}

	static log(message?: any, ...optionalParams: any[]) {
		console.log(LoggerHelper.logString(message, ...optionalParams))
	}

	static warn(message?: any, ...optionalParams: any[]) {
		console.warn(LoggerHelper.warnString(message, ...optionalParams))
	}

	static error(message?: any, ...optionalParams: any[]) {
		console.error(LoggerHelper.errorString(message, ...optionalParams))
	}

	static success(message?: any, ...optionalParams: any[]) {
		console.log(LoggerHelper.successString(message, ...optionalParams))
	}

	static table(tabularData: any, properties?: readonly string[]) {
		console.table(tabularData, properties)
	}
}