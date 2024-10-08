import cli from 'cli-color'

export class LoggerHelper {
	static logString(message?: any, ...optionalParams: any[]) {
		return cli.white(message, optionalParams)
	}

	static warnString(message?: any, ...optionalParams: any[]) {
		return cli.yellow(message, optionalParams)
	}

	static errorString(message?: any, ...optionalParams: any[]) {
		return cli.red(message, optionalParams)
	}

	static log(message?: any, ...optionalParams: any[]) {
		console.log(LoggerHelper.logString(message, optionalParams))
	}

	static warn(message?: any, ...optionalParams: any[]) {
		console.warn(LoggerHelper.warnString(message, optionalParams))
	}

	static error(message?: any, ...optionalParams: any[]) {
		console.error(LoggerHelper.errorString(message, optionalParams))
	}
}