import { prisma } from "../lib/prisma";

export async function listArticles() {
	try {
		return await prisma.Article.findMany({
			include: {
				author: {
					select: { id: true, name: true },
				},
			},
		});
	}
	catch (error) {
		console.error("Failed to list articles:", error);
		throw new Error("Could not list articles");
	}
}

export async function getArticleById(id: string) {
	try {
		return await prisma.Article.findUnique({
			where: { id },
			include: {
				author: {
					select: { id: true, name: true },
				},
			},
		});
	}
	catch (error) {
		console.error("Failed to fetch article:", error);
		throw new Error("Could not fetch article");
	}
}