import { prisma } from "../lib/prisma";
import { redisClient } from "../lib/redis";

type Check = { status: "ok" | "down"; latencyMs: number; error?: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timer: NodeJS.Timeout;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error("timeout")), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function timed(fn: () => Promise<unknown>): Promise<Check> {
	const start = Date.now();
	try {
		await withTimeout(fn(), 2000);
		return { status: "ok", latencyMs: Date.now() - start };
	}
	catch (error) {
		return { status: "down", latencyMs: Date.now() - start, error: (error as Error).message };
	}
}

export async function checkServices() {
	const [postgres, redis] = await Promise.all([
		timed(() => prisma.$queryRaw`SELECT 1`),
		timed(() => redisClient.ping()),
	]);
	const services = { backend: { status: "ok", latencyMs: 0} as Check, postgres, redis };
	const status = postgres.status === "ok" && redis.status === "ok" ? "ok" : "degraded";
	return { status, services, checkedAt: new Date().toISOString() };
}
