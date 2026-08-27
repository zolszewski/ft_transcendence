import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	skipSuccessfulRequests: true,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	ipv6Subnet: 56,
});


export function requireAuth(req: Request, res: Response, next: NextFunction) {
	if (!req.session.userId)
		return res.status(401).json({ error: "Not authenticated" });
	next();
}