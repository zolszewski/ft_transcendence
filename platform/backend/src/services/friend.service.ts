import { FriendshipStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getAvatarUrl, getUserById } from "./user.service";

type FriendUserRow = {
	id: string;
	name: string;
	faculty: string | null;
	avatarId: string | null;
};

function mapFriendUser(user: FriendUserRow) {
	return {
		id: user.id,
		name: user.name,
		faculty: user.faculty,
		avatarUrl: getAvatarUrl(user.avatarId),
	};
}

export async function listFriends(userId: string) {
	const rows = await prisma.friendship.findMany({
		where: {
			status: FriendshipStatus.ACCEPTED,
			OR: [{ requesterId: userId }, { addresseeId: userId }],
		},
		include: {
			requester: { select: { id: true, name: true, faculty: true, avatarId: true } },
			addressee: { select: { id: true, name: true, faculty: true, avatarId: true } },
		},
		orderBy: { createdAt: "desc" },
	});
	return rows.map((row) =>
		mapFriendUser(row.requesterId === userId ? row.addressee : row.requester),
	);
}

export async function listFriendIds(userId: string): Promise<string[]> {
	const rows = await prisma.friendship.findMany({
		where: {
			status: FriendshipStatus.ACCEPTED,
			OR: [{ requesterId: userId }, { addresseeId: userId }],
		},
		select: { requesterId: true, addresseeId: true },
	});
	return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
}

export async function listIncomingRequests(userId: string) {
	const rows = await prisma.friendship.findMany({
		where: { addresseeId: userId, status: FriendshipStatus.PENDING },
		include: {
			requester: { select: { id: true, name: true, faculty: true, avatarId: true } },
		},
		orderBy: { createdAt: "desc" },
	});
	return rows.map((row) => ({
		id: row.id,
		createdAt: row.createdAt,
		from: mapFriendUser(row.requester),
	}));
}

export async function getRelationStatus(viewerId: string, otherUserId: string) {
	if (viewerId === otherUserId) return "none" as const;

	const row = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ requesterId: viewerId, addresseeId: otherUserId },
				{ requesterId: otherUserId, addresseeId: viewerId },
			],
		},
	});

	if (!row) return "none" as const;
	if (row.status === FriendshipStatus.ACCEPTED) return "friends" as const;
	if (row.requesterId === viewerId) return "pending_outgoing" as const;
	return "pending_incoming" as const;
}

async function acceptPair(requesterId: string, addresseeId: string) {
	await prisma.friendship.deleteMany({
		where: {
			status: FriendshipStatus.PENDING,
			OR: [
				{ requesterId, addresseeId },
				{ requesterId: addresseeId, addresseeId: requesterId },
			],
		},
	});

	return prisma.friendship.upsert({
		where: {
			requesterId_addresseeId: { requesterId, addresseeId },
		},
		update: { status: FriendshipStatus.ACCEPTED },
		create: {
			requesterId,
			addresseeId,
			status: FriendshipStatus.ACCEPTED,
		},
	});
}

async function sendRequestOnce(requesterId: string, addresseeId: string) {
	const reverse = await prisma.friendship.findUnique({
		where: {
			requesterId_addresseeId: {
				requesterId: addresseeId,
				addresseeId: requesterId,
			},
		},
	});

	if (reverse?.status === FriendshipStatus.PENDING) {
		return acceptPair(addresseeId, requesterId);
	}

	return prisma.friendship.create({
		data: {
			requesterId,
			addresseeId,
			status: FriendshipStatus.PENDING,
		},
	});
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
	if (requesterId === addresseeId) throw new Error("SELF");
	const target = await getUserById(addresseeId);
	if (!target) throw new Error("NOT_FOUND");

	const existing = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ requesterId, addresseeId },
				{ requesterId: addresseeId, addresseeId: requesterId },
			],
		},
	});
	if (existing?.status === FriendshipStatus.ACCEPTED) throw new Error("ALREADY_FRIENDS");
	if (existing?.status === FriendshipStatus.PENDING && existing.requesterId === requesterId) {
		throw new Error("ALREADY_PENDING");
	}
	if (existing?.status === FriendshipStatus.PENDING && existing.addresseeId === requesterId) {
		return acceptPair(existing.requesterId, existing.addresseeId);
	}

	try {
		return await sendRequestOnce(requesterId, addresseeId);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			const retry = await prisma.friendship.findFirst({
				where: {
					OR: [
						{ requesterId, addresseeId },
						{ requesterId: addresseeId, addresseeId: requesterId },
					],
				},
			});
			if (retry?.status === FriendshipStatus.PENDING && retry.requesterId === addresseeId) {
				return acceptPair(addresseeId, requesterId);
			}
			if (retry) throw new Error("ALREADY_PENDING");
		}
		throw error;
	}
}

export async function acceptFriendRequest(userId: string, otherUserId: string) {
	const row = await prisma.friendship.findFirst({
		where: {
			requesterId: otherUserId,
			addresseeId: userId,
			status: FriendshipStatus.PENDING,
		},
	});
	if (!row) throw new Error("NOT_FOUND");
	return prisma.friendship.update({
		where: { id: row.id },
		data: { status: FriendshipStatus.ACCEPTED },
	});
}

export async function removeFriendship(userId: string, otherUserId: string) {
	const result = await prisma.friendship.deleteMany({
		where: {
			OR: [
				{ requesterId: userId, addresseeId: otherUserId },
				{ requesterId: otherUserId, addresseeId: userId },
			],
		},
	});
	if (result.count === 0) throw new Error("NOT_FOUND");
}
