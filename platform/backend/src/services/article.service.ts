import { setCached, getCached, getArticlesCacheVersion, bumpArticlesCacheVersion } from "../lib/cache";
import { prisma } from "../lib/prisma";
import { ArticleStatus } from "@prisma/client";

type ListArticlesOptions = {
	search?: string;
	sort?: "newest" | "oldest";
	page?: number;
	limit?: number;
};

export async function listArticles(options: ListArticlesOptions = {}) {
	const { search, sort = "newest", page = 1, limit = 10 } = options;
	const version = await getArticlesCacheVersion();
	const cacheKey = `articles:list:v${version}:search=${search ?? ""}:sort=${sort}:page=${page}:limit=${limit}`;
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
	};
	try {
		const [articles, total] = await Promise.all([
			prisma.Article.findMany({
				where,
				include: { author: { select: { id: true, name: true } } },
				orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.Article.count({ where }),
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
			prisma.Article.findMany({
				where,
				include: { author: { select: { id: true, name: true } } },
				orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.Article.count({ where }),
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
			prisma.Article.findMany({ where, include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" }, skip: (page - 1) * limit, take: limit }),
			prisma.Article.count({ where }),
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


export async function createArticle(
  authorId: string,
  title: string,
  content: string,
  abstract?: string,
  miniatureId?: string,
  pdfId?: string,
  miniatureFocusX = 50,
  miniatureFocusY = 50,
) {
  try {
    await bumpArticlesCacheVersion();
    return await prisma.Article.create({
      data: {
        title,
        content,
        abstract,
        authorId,
        miniatureId,
        pdfId,
        miniatureFocusX,
        miniatureFocusY,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  } catch (error) {
    console.error("Failed to create article:", error);
    throw new Error("Could not create article");
  }
}


export function getMiniatureUrl(miniatureId: string | null): string {
	if (miniatureId)
		return `/api/uploads/${miniatureId}`;
	return "/default-article-thumbnail.jpg";
}

export function articleWithMediaUrls<T extends { miniatureId?: string | null; pdfId?: string | null }>(
	article: T,
) {
	return {
		...article,
		miniatureUrl: getMiniatureUrl(article.miniatureId ?? null),
		pdfUrl: article.pdfId ? `/api/uploads/${article.pdfId}` : null,
	};
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    content?: string;
    abstract?: string;
    miniatureId?: string | null;
    pdfId?: string | null;
    miniatureFocusX?: number;
    miniatureFocusY?: number;
  }
) {
  try {
    await bumpArticlesCacheVersion();
    const { miniatureId, pdfId, ...rest } = data;
    const updateData = {
      ...rest,
      ...(miniatureId !== undefined ? { miniatureId } : {}),
      ...(pdfId !== undefined ? { pdfId } : {}),
    };
    return await prisma.Article.update({
      where: { id },
      data: updateData,
      include: { author: { select: { id: true, name: true } } },
    });
  } catch (error) {
    console.error("Failed to update article:", error);
    throw new Error("Could not update article");
  }
}

export async function deleteArticle(id: string) {
	try {
		await bumpArticlesCacheVersion();
		await prisma.Article.delete({ where: { id } });
	}
	catch (error) {
		console.error("Failed to delete article:", error);
		throw new Error("Could not delete article");
	}
}

export async function updateArticleStatus(id: string,status: ArticleStatus) {
	try {
		await bumpArticlesCacheVersion();
		return await prisma.Article.update({
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
