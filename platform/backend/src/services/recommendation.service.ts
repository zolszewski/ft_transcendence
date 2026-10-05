import { prisma } from "../lib/prisma";

function cosineSimilarity(a: number[], b: number[]): number {
	let dot = 0, normA = 0, normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	if (normA === 0 || normB === 0)
		return 0;
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function weightedAverage(articles: { embedding: number[]; weight: number }[]): number[] | null {
	const valid = articles.filter((a) => a.embedding.length > 0);
	if (valid.length === 0)
		return null;
	const dim = valid[0].embedding.length;
	const sum = new Array(dim).fill(0);
	let totalWeight = 0;
	for (const article of valid) {
		totalWeight += article.weight;
		for (let j = 0; j < dim; j++)
			sum[j] += article.embedding[j] * article.weight;
	}
	return sum.map((v) => v / totalWeight);
}

async function getEngagedArticlesIds(userId: string): Promise<Set<string>> {
	const [views, likes, comments, reviews, authored] = await Promise.all([
		prisma.ArticleView.findMany({ where: { userId }, select: { articleId: true } }),
		prisma.ArticleLike.findMany({ where: { userId }, select: { articleId: true } }),
		prisma.Comment.findMany({ where: { authorId: userId }, select: { articleId: true } }),
		prisma.Review.findMany({ where: { reviewerId: userId }, select: { articleId: true } }),
		prisma.Article.findMany({ where: { authorId: userId }, select: { id: true } }),
	]);
	const ids = new Set<string>();
	views.forEach((v) => ids.add(v.articleId));
	likes.forEach((l) => ids.add(l.articleId));
	comments.forEach((c) => ids.add(c.articleId));
	reviews.forEach((r) => ids.add(r.articleId));
	authored.forEach((a) => ids.add(a.id));
	return ids;
}

async function buildReaderProfile(userId: string): Promise<number[] | null> {
	const [views, likes, comments, reviews] = await Promise.all([
		prisma.ArticleView.findMany({ where: { userId }, select: { articleId: true } }),
		prisma.ArticleLike.findMany({ where: { userId }, select: { articleId: true } }),
		prisma.Comment.findMany({ where: { authorId: userId }, select: { articleId: true } }),
		prisma.Review.findMany({ where: { reviewerId: userId }, select: { articleId: true } }),
	]);
	const weightById = new Map<string, number>();
	const addWeight = (id: string, w: number) => weightById.set(id, (weightById.get(id) ?? 0) + w);
	views.forEach((v) => addWeight(v.articleId, 1));
	likes.forEach((l) => addWeight(l.articleId, 2));
	comments.forEach((c) => addWeight(c.articleId, 2));
	reviews.forEach((r) => addWeight(r.articleId, 3));
	if (weightById.size === 0)
		return null;
	const articles = await prisma.Article.findMany({
		where: { id: { in: [...weightById.keys()] }, authorId: { not: userId } },
		select: { id: true, embedding: true },
	});
	return weightedAverage(articles.map((a) => ({ embedding: a.embedding, weight: weightById.get(a.id)! })));
}

async function buildAuthorProfile(userId: string): Promise<number[] | null> {
	const articles = await prisma.Article.findMany({
		where: { authorId: userId, status: "PUBLISHED" },
		select: { embedding: true },
	});
	return weightedAverage(articles.map((a) => ({ embedding: a.embedding, weight: 1 })));
}

async function fallbackArticles(excludeIds: Set<string>, limit: number) {
	return prisma.Article.findMany({
		where: { status: "PUBLISHED", id: { notIn: [...excludeIds] } },
		include: { author: { select: { id: true, name: true } } },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

async function rankArticlesByProfile(profile: number[], excludeIds: Set<string>, limit: number) {
	const candidates = await prisma.Article.findMany({
		where: { status: "PUBLISHED", id: { notIn: [...excludeIds] } },
		include: { author: { select: { id: true, name: true } } },
	});
	return candidates
		.filter((a) => a.embedding.length > 0)
		.map((article) => ({ article, score: cosineSimilarity(profile, article.embedding) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((s) => s.article);
}

export async function getDiscoverRecommendations(userId: string, limit = 10) {
	const [profile, exclude] = await Promise.all([buildReaderProfile(userId), getEngagedArticlesIds(userId)]);
	if (!profile)
		return fallbackArticles(exclude, limit);
	return rankArticlesByProfile(profile, exclude, limit);
}

export async function getDeepenRecommendations(userId: string, limit = 10) {
	const [profile, exclude] = await Promise.all([buildAuthorProfile(userId), getEngagedArticlesIds(userId)]);
	if (!profile)
		return [];
	return rankArticlesByProfile(profile, exclude, limit);
}