import { setCached, getCached, getArticlesCacheVersion, bumpArticlesCacheVersion } from "../lib/cache";
import { prisma } from "../lib/prisma";
import { computeEmbedding } from "../lib/embeddings";
import { ArticleStatus } from "@prisma/client";
import { isOwner } from "../utils/authorization";

type ListArticlesOptions = {
	search?: string;
	sort?: "newest" | "oldest";
	page?: number;
	limit?: number;
	createdFrom?: Date;
	createdTo?: Date;
	faculty?: string;
};

export async function listArticles(options: ListArticlesOptions = {}) {
	const { search, sort = "newest", page = 1, limit = 10, createdFrom, createdTo, faculty } = options;
	const version = await getArticlesCacheVersion();
	const cacheKey = `articles:list:v${version}:search=${search ?? ""}:sort=${sort}:page=${page}:limit=${limit}:from=${createdFrom?.toISOString() ?? ""}:to=${createdTo?.toISOString() ?? ""}:faculty=${faculty ?? ""}`;
	const cached = await getCached<{ articles: unknown[]; total: number; page: number; totalPages: number }> (cacheKey);
	if (cached)
		return cached;
	const where = {
		status: "PUBLISHED" as const,
		...(search
			? {
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{ content: { contains: search, mode: "insensitive" as const} },
				],
			}
		: {}),
		...((createdFrom || createdTo)
			? {
				createdAt: {
					...(createdFrom ? { gte: createdFrom } : {}),
					...(createdTo ? { lte: createdTo } : {}),
				},
			}
			: {}),
		...(faculty
			? { author: { faculty: { equals: faculty, mode: "insensitive" as const } } }
			: {}),
	};
	try {
		const [articles, total] = await Promise.all([
			prisma.article.findMany({
				where,
				include: { author: { select: { id: true, name: true } } },
				orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.article.count({ where }),
		]);
		const result = { articles, total, page, totalPages: Math.ceil(total / limit) };
		await setCached(cacheKey, result, 60);
		return result;
	}
	catch (error) {
		console.error("Failed to list articles:", error);
		throw new Error("Could not list articles");
	}
}

type ListSubmittedArticlesOptions = {
	reviewerId: string;
	search?: string;
	sort?: "newest" | "oldest";
	page?: number;
	limit?: number;
};

export async function listSubmittedArticlesForReview(options: ListSubmittedArticlesOptions) {
	const { reviewerId, search, sort = "newest", page = 1, limit = 10 } = options;
	const version = await getArticlesCacheVersion();
	const cacheKey = `articles:submitted:v${version}:reviewer=${reviewerId}:search=${search ?? ""}:sort=${sort}:page=${page}:limit=${limit}`;
	const cached = await getCached<{ articles: unknown[]; total: number; page: number; totalPages: number }>(cacheKey);
	if (cached)
		return cached;
	const where = {
		status: "SUBMITTED" as const,
		authorId: { not: reviewerId },
		reviews: { none: { reviewerId } },
		...(search
			? {
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{ content: { contains: search, mode: "insensitive" as const } },
				],
			}
			: {}),
	};
	try {
		const [articles, total] = await Promise.all([
			prisma.article.findMany({
				where,
				include: { author: { select: { id: true, name: true } } },
				orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.article.count({ where }),
		]);
		const result = { articles, total, page, totalPages: Math.ceil(total / limit) };
		await setCached(cacheKey, result, 60);
		return result;
	}
	catch (error) {
		console.error("Failed to list submitted articles:", error);
		throw new Error("Could not list submitted articles");
	}
}

type ListMyArticlesOptions = {
	authorId: string;
	status?: ArticleStatus;
	search?: string;
	sort?: "newest" | "oldest";
	page?: number;
	limit?: number;
};

export async function listMyArticles(options: ListMyArticlesOptions) {
	const { authorId, status, search, sort = "newest", page = 1, limit = 10 } = options;
	const version = await getArticlesCacheVersion();
	const cacheKey = `articles:mine:v${version}:author=${authorId}:status=${status ?? "all"}:search=${search ?? ""}:sort=${sort}:page=${page}:limit=${limit}`;
	const cached = await getCached<{ articles: unknown[]; total: number, page: number, totalPages: number }>(cacheKey);

	if (cached)
		return cached;
	const where = {
		authorId,
		...(status ? { status } : {}),
		...(search
			? { OR: [
				{ title: { contains: search, mode: "insensitive" as const } },
				{ content: { contains: search, mode: "insensitive" as const } },
			] }
			: {})
	};
	try {
		const [articles, total] = await Promise.all([
			prisma.article.findMany({ where, include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" }, skip: (page - 1) * limit, take: limit }),
			prisma.article.count({ where }),
		]);
		const result = { articles, total, page, totalPages: Math.ceil(total / limit) };
		await setCached(cacheKey, result, 60);
		return result;
	}
	catch (error) {
		console.error("Failed to list my articles:", error);
		throw new Error("Could not list my articles");
	}
}

export function canViewArticle(article: { status: ArticleStatus; authorId: string }, userId?: string): boolean {
	if (article.status === "PUBLISHED")
		return true;
	if (!userId)
		return false;
	if (isOwner(article.authorId, userId))
		return true;
	return article.status === "SUBMITTED";
}

export function withComputedUrls(article: any, userId?: string) {
	return {
		...article,
		miniatureUrl: getMiniatureUrl(article.miniatureId),
		documentUrl: article.documentId && canViewArticle(article, userId)
			? `/api/articles/${article.id}/document`
			: null,
	};
}

export async function presentArticles(articles: any[], userId?: string) {
	const withUrls = articles.map((a) => withComputedUrls(a, userId));
	if (withUrls.length === 0)
		return withUrls;
	const ids = withUrls.map((a) => a.id);
	const [counts, mine] = await Promise.all([
		prisma.articleLike.groupBy({ by: ["articleId"], where: { articleId: { in: ids } }, _count: { _all: true } }),
		userId
			? prisma.articleLike.findMany({ where: { userId, articleId: { in: ids } }, select: { articleId: true } })
			: Promise.resolve([]),
	]);
	const countById = new Map(counts.map((c) => [c.articleId, c._count._all]));
	const likedIds = new Set(mine.map((m) => m.articleId));
	return withUrls.map((a) => ({ ...a, likeCount: countById.get(a.id) ?? 0, likedByMe: likedIds.has(a.id) }));
}

export async function getArticleById(id: string) {
	try {
		return await prisma.article.findUnique({
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

export async function createArticle(authorId: string, title: string, content: string, abstract?: string, miniatureId?: string, documentId?: string,
	miniatureFocusX = 50,
  	miniatureFocusY = 50,) {
	try {
		await bumpArticlesCacheVersion();
		const embedding = await computeEmbedding(`${title}\n${abstract ?? ""}\n${content}`);
		return await prisma.article.create({
			data: { title, content, abstract, authorId, miniatureId, documentId, miniatureFocusX, miniatureFocusY, embedding },
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to create article:", error);
		throw new Error("Could not create article");
	}
}


export function getMiniatureUrl(miniatureId: string | null): string {
	if (miniatureId)
		return `/api/uploads/${miniatureId}`;
	return "/default-article-thumbnail.jpg";
}

export async function updateArticle(id: string, data: { title?: string, content?: string, abstract?: string, miniatureId?: string | null, documentId?: string | null, miniatureFocusX?: number;
    miniatureFocusY?: number; }) {
	try {
		await bumpArticlesCacheVersion();
		const { miniatureId, documentId, ...rest } = data;
    	const updateData = {
      ...rest,
      ...(miniatureId !== undefined ? { miniatureId } : {}),
      ...(documentId !== undefined ? { documentId } : {}),
    };
		let embedding: number[] | undefined;
		if (data.title && data.content)
			embedding = await computeEmbedding(`${data.title}\n${data.abstract ?? ""}\n${data.content}`);
		return await prisma.article.update({
			where: { id },
			data: embedding ? { ...updateData, embedding } : updateData,
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
		await bumpArticlesCacheVersion();
		await prisma.article.delete({ where: { id } });
	}
	catch (error) {
		console.error("Failed to delete article:", error);
		throw new Error("Could not delete article");
	}
}

export async function updateArticleStatus(id: string,status: ArticleStatus) {
	try {
		await bumpArticlesCacheVersion();
		return await prisma.article.update({
			where: { id },
			data: { status },
			include: { author: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to update article status:", error);
		throw new Error("Could not update article status");
	}
}

export async function recordArticleView(userId: string, articleId: string) {
	try {
		await prisma.articleView.upsert({
			where: { userId_articleId: { userId, articleId } },
			create: { userId, articleId },
			update: {},
		});
	}
	catch (error) {
		console.error("Failed to record article view:", error);
		throw new Error("Could not record article view");
	}
}

export async function likeArticle(userId: string, articleId: string) {
	try {
		await prisma.articleLike.upsert({
			where: { userId_articleId: { userId, articleId } },
			create: { userId, articleId },
			update: {},
		});
	}
	catch (error) {
		console.error("Failed to like article:", error);
		throw new Error("Could not like article");
	}
}

export async function unlikeArticle(userId: string, articleId: string) {
	try {
		await prisma.articleLike.deleteMany({ where: { userId, articleId } });
	}
	catch (error) {
		console.error("Failed to unlike article:", error);
		throw new Error("Could not unlike article");
	}
}