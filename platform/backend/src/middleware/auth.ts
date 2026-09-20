import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { getUserIdByApiKey } from "../services/apiKey.service";

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

export async function resolveApiKey(req: Request, res: Response, next: NextFunction) {
	if (!req.session.userId && req.headers.authorization?.startsWith("Bearer ")) {
		const rawKey = req.headers.authorization.slice("Bearer ".length);
		const userId = await getUserIdByApiKey(rawKey);
		if (userId)
			req.session.userId = userId;
	}
	next();
}