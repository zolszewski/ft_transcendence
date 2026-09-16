import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	logger.error("Unhandled error", {
		message: err.message,
		path: req.path,
		method: req.method,
	});
	res.status(500).json({ error: "Something went wrong" });
}