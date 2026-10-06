import crypto from "crypto";
import { prisma } from "../lib/prisma";



export async function generateApiKey(): Promise<string> {
	return crypto.randomBytes(32).toString("hex");
}

export async function hashApiKey(key: string): Promise<string> {
	return crypto.createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(userId: string): Promise<string> {
	try {
		const apiKey = await generateApiKey();
		const keyHash = await hashApiKey(apiKey);

		await prisma.apiKey.create({
			data: { keyHash, userId },
			include: { user: { select: { id: true, name: true } } },
		});
		return apiKey;
	}
	catch (error) {
		console.error("Failed to create API key:", error);
		throw new Error("Could not create API key");
	}
}

export async function getUserIdByApiKey(rawKey: string) {
	try {
		const keyHash = await hashApiKey(rawKey);
		const apiKey = await prisma.apiKey.findUnique({
			where: { keyHash },
		});
		if (!apiKey)
			return null;
		return apiKey.userId;
	}
	catch (error) {
		console.error("Failed to fetch user by API key:", error);
		throw new Error("Could not fetch user by API key");
	}
}

