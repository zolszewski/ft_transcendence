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

export async function createArticle(authorId: string, title: string, content: string, abstract?: string) {
	try {
		return await prisma.Article.create({
			data: { title, content, abstract, authorId },
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to create article:", error);
		throw new Error("Could not create article");
	}
}

export async function updateArticle(id: string, data: { title?: string, content?: string, abstract?:string }) {
	try {
		return await prisma.Article.update({
			where: { id },
			data,
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to update article:", error);
		throw new Error("Could not update article");
	}
}

export async function deleteArticle(id: string) {
	try {
		await prisma.Article.delete({ where: { id } });
	}
	catch (error) {
		console.error("Failed to delete article:", error);
		throw new Error("Could not delete article");
	}
}