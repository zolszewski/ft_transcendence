import { prisma } from "../lib/prisma";

// même clé quel que soit l'ordre des deux users (A:B == B:A)
function getDirectKey(userId: string, otherUserId: string) {
	return [userId, otherUserId].sort().join(":");
}

export async function listMessages(userId: string, otherUserId: string) {
	return prisma.message.findMany({
		where: { conversation: { directKey: getDirectKey(userId, otherUserId) } },
		select: {
			id: true,
			content: true,
			conversationId: true,
			senderId: true,
			createdAt: true,
			readAt: true,
		},
		orderBy: { createdAt: "asc" },
	});
}

async function createMessage(userId: string, otherUserId: string, content: string) {
	const directKey = getDirectKey(userId, otherUserId);

	return prisma.$transaction(async (transaction) => {
		// crée la conversation si elle n'existe pas, sinon met à jour updatedAt
		const conversation = await transaction.conversation.upsert({
			where: { directKey },
			update: { updatedAt: new Date() },
			create: {
				directKey,
				participants: {
					create: [
						{ userId },
						{ userId: otherUserId },
					],
				},
			},
		});

		return transaction.message.create({
			data: {
				content: content.trim(),
				conversationId: conversation.id,
				senderId: userId,
			},
		});
	});
}

export async function sendMessage(userId: string, otherUserId: string, content: string) {
	try {
		return await createMessage(userId, otherUserId, content);
	}
	catch (error: any) {
		// P2002 : l'autre user a créé la conversation au même moment, elle existe maintenant
		if (error?.code === "P2002")
			return createMessage(userId, otherUserId, content);
		throw error;
	}
}
