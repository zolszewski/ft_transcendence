import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
	redis: ReturnType<typeof createClient> | undefined;
};

export const redisClient =
	globalForRedis.redis ??
	createClient({
		url: process.env.REDIS_URL,
	});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

if (!redisClient.isOpen) {
	redisClient.connect();
}

if (process.env.NODE_ENV !== "production") {
	globalForRedis.redis =redisClient;
}