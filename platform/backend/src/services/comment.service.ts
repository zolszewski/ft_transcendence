import { prisma } from "../lib/prisma";

export async function createComment(articleId: string, authorId: string, content: string) {
	try {
		return await prisma.comment.create({
			data: { articleId, authorId, content },
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to create comment:", error);
		throw new Error("Could not create comment");
	}
}

export async function getCommentById(id: string) {
	try {
		return await prisma.comment.findUnique({ where: { id } });
	}
	catch (error) {
		console.error("Failed to fetch comment:", error);
		throw new Error("Could not fetch comment");
	}
}

export async function listCommentsForArticle(articleId: string) {
	try {
		return await prisma.comment.findMany({
			where: { articleId },
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to list comments:", error);
		throw new Error("Could not list comments");
	}
}

export async function deleteComment(id: string) {
	try {
		await prisma.comment.delete({ where: { id } });
	}
	catch (error) {
		console.error("Failed to delete comment:", error);
		throw new Error("Could not delete comment");
	}
}