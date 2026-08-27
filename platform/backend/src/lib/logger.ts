type LogLevel= "info" | "warn" | "error";

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
	console.log(JSON.stringify({
		timestamp: new Date().toISOString(),
		level,
		message,
		...context,
	}));
}

export const logger = {
	info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
	warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
	error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};