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

export async function updateUser(
	id: string,
	data: {
		name?: string;
		email?: string;
		faculty?: string | null;
		specialization?: string | null;
	},
) {
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

export async function createOAuthUser(email: string, name: string, oauthProvider: string, oauthId: string) {
	try {
		return await prisma.User.create({
			data: { email, name, oauthProvider, oauthId },
		});
	}
	catch (error) {
		console.error("Failed to create OAuth user:", error);
		throw new Error("Could not create user");
	}
}

export async function getUserByOAuth(oauthProvider: string, oauthId : string) {
	try {
		return await prisma.User.findUnique({
			where: { oauthProvider_oauthId: { oauthProvider, oauthId }}
		});
	}
	catch (error) {
		console.error("Failed to fetch user by oauth:", error);
		throw new Error("Could not fetch user");
	}
}


export async function searchUsersByName(query: string, excludeUserId: string) {
	try {
		return await prisma.User.findMany({
			where: {
				name: { contains: query, mode: "insensitive" },
				id: { not : excludeUserId },
			},
			take: 20,
		});
	}
	catch (error) {
		console.error("Failed to search users:", error);
		throw new Error("Could not search users");
	}
}