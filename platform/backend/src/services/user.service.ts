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

export async function updateUser(id: string, data: { name?: string, email?: string }) {
	try {
		return await prisma.User.update({
			where: { id },
			data,
		});

	}
	catch (error) {
		console.error("Failed to update user:", error);
		throw new Error("Could not update user");
	}
}

export async function setUserAvatar(id: string, avatarId: string) {
	try {
		return await prisma.User.update({
			where: { id },
			data : { avatarId },
		});
	}
	catch (error) {
		console.error("Failed to set user avatar:", error);
		throw new Error("Could not set user avatar");
	}
}

export function getAvatarUrl(avatarId: string | null): string {
	if (avatarId)
		return `/api/uploads/${avatarId}`;
	return "/default-avatar.jpg";
}