import { redisClient } from "./redis";

export async function getCached<T>(key: string): Promise<T | null> {
	const value = await redisClient.get(key);
	if (!value)
		return null;
	return JSON.parse(value) as T;
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
	await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function getArticlesCacheVersion(): Promise<number> {
	const version = await redisClient.get("articles:cache:version");
	if (!version)
		return 0;
	return Number(version);
}

export async function bumpArticlesCacheVersion(): Promise<void> {
	await redisClient.incr("articles:cache:version");
}