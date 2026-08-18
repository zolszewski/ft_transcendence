import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisClient } from "../lib/redis";

export const sessionMiddleware = session({
	store: new RedisStore({ client: redisClient }),
	secret: process.env.SESSION_SECRET!,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
});