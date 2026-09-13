import { prisma } from "../lib/prisma";

async function findConversation(userId: string, otherUserId: string) {
	return prisma.Conversation.findFirst({
		where: {
			participants: {
				some: { userId },
			},
			AND: {
				participants: {
					some: { userId: otherUserId },
				},
			},
		},
	});
}

export async function listMessages(userId: string, otherUserId: string) {
	const conversation = await findConversation(userId, otherUserId);
	if (!conversation)
		return [];

	return prisma.Message.findMany({
		where: { conversationId: conversation.id },
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

export async function sendMessage(userId: string, otherUserId: string, content: string) {
	return prisma.$transaction(async (transaction) => {
		let conversation = await transaction.Conversation.findFirst({
			where: {
				participants: {
					some: { userId },
				},
				AND: {
					participants: {
						some: { userId: otherUserId },
					},
				},
			},
		});

		if (!conversation) {
			conversation = await transaction.Conversation.create({
				data: {
					participants: {
						create: [
							{ userId },
							{ userId: otherUserId },
						],
					},
				},
			});
		}

		const message = await transaction.Message.create({
			data: {
				content: content.trim(),
				conversationId: conversation.id,
				senderId: userId,
			},
		});

		await transaction.Conversation.update({
			where: { id: conversation.id },
			data: { updatedAt: new Date() },
		});

		return message;
	});
}