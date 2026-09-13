import { prisma } from "../lib/prisma";

export async function createUser(email: string, name: string, hashedPassword: string) {
	try {
		return await prisma.User.create({
			data: {
				email,
				name,
				password: hashedPassword,
			},
		});
	}
	catch (error) {
		console.error("Failed to create user:", error);
		throw new Error("Could not create user");
	}
}

export async function getUserByEmail(email: string) {
	try {
		return await prisma.User.findUnique({
			where: {email},
		});
	}
	catch (error) {
		console.error("Failed to fetch user by email:", error);
		throw new Error("Could not fetch user");
	}
}

export async function getUserById(id: string) {
	try {
		return await prisma.User.findUnique({
			where: { id },
		});
	}
	catch (error) {
		console.error("Failed to fetch user by id:", error);
		throw new Error("Could not fetch user");
	}
}

export async function getOtherUsers(currentUserId: string) {
	try {
		return await prisma.User.findMany({
			where: { id: { not: currentUserId } },
			select: {
				id: true,
				email: true,
				name: true,
			},
			orderBy: { name: "asc" },
		});
	}
	catch (error) {
		console.error("Failed to fetch users:", error);
		throw new Error("Could not fetch users");
	}
}