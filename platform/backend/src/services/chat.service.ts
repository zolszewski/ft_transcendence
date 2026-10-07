import { prisma } from "../lib/prisma";

//same key whatever the order (A:B == B:A)
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
		//create the convo if missing, otherwise bump updatedAt
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
		//P2002: the other user created the convo at the same time, so it exists now
		if (error?.code === "P2002")
			return createMessage(userId, otherUserId, content);
		throw error;
	}
}
