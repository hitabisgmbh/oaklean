import util from 'util'

import cli from 'cli-color'

export class LoggerHelper {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static logString(message?: any, ...optionalParams: any[]) {
		return cli.white(util.format.apply(this, [message, ...optionalParams]))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static warnString(message?: any, ...optionalParams: any[]) {
		return cli.yellow(util.format.apply(this, [message, ...optionalParams]))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static errorString(message?: any, ...optionalParams: any[]) {
		return cli.red(util.format.apply(this, [message, ...optionalParams]))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static successString(message?: any, ...optionalParams: any[]) {
		return cli.green(util.format.apply(this, [message, ...optionalParams]))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static log(message?: any, ...optionalParams: any[]) {
		console.log(LoggerHelper.logString(message, ...optionalParams))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static warn(message?: any, ...optionalParams: any[]) {
		console.warn(LoggerHelper.warnString(message, ...optionalParams))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static error(message?: any, ...optionalParams: any[]) {
		console.error(LoggerHelper.errorString(message, ...optionalParams))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static success(message?: any, ...optionalParams: any[]) {
		console.log(LoggerHelper.successString(message, ...optionalParams))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static table(tabularData: any, properties?: readonly string[]) {
		console.table(tabularData, properties)
	}
}