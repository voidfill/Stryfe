export const enum LogLevels {
	log = "log",
	info = "info",
	warn = "warn",
	error = "error",
	debug = "debug",
}

export class Logger {
	constructor(private readonly name = "Stryfe", private readonly color = "purple") {}

	private _log(level: LogLevels, ...args: any[]): void {
		console[level](`%c[${this.name}]`, `font-weight: bold; color: ${this.color};`, ...args);
	}

	log(...args: any[]): void {
		this._log(LogLevels.log, ...args);
	}

	info(...args: any[]): void {
		this._log(LogLevels.info, ...args);
	}

	warn(...args: any[]): void {
		this._log(LogLevels.warn, ...args);
	}

	error(...args: any[]): void {
		this._log(LogLevels.error, ...args);
	}

	debug(...args: any[]): void {
		this._log(LogLevels.debug, ...args);
	}
}

export default new Logger();
