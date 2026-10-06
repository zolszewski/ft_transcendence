import { prisma } from "../lib/prisma";
import { ReviewStatus } from "@prisma/client"
import { bumpArticlesCacheVersion } from "../lib/cache";

export async function createReview(articleId: string, reviewerId: string, comment?: string) {
	try {
		await bumpArticlesCacheVersion();
		return await prisma.review.create({
			data: { articleId, reviewerId, comment },
			include: { reviewer: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to create review:", error);
		throw new Error("Could not create review");
	}
}

export async function getReviewByArticleAndReviewer(articleId: string, reviewerId: string) {
	try {
		return await prisma.review.findUnique({
			where: { articleId_reviewerId: {articleId, reviewerId } },
		});
	}
	catch (error) {
		console.error("Failed to fetch review:", error);
		throw new Error("Could not fetch review");
	}
}

export async function listReviewsForArticle(articleId: string) {
	try {
		return await prisma.review.findMany({
			where: { articleId },
			include: { reviewer: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.error("Failed to list reviews:", error);
		throw new Error("Could not list reviews");
	}
}

export async function getReviewById(id: string) {
	try {
		return await prisma.review.findUnique({
			where: { id },
		});
	}
	catch (error) {
		console.error("Failed to fetch review:", error);
		throw new Error("Could not fetch review");
	}
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
	try {
		return await prisma.review.update({
			where: { id },
			data: { status },
			include: { reviewer: { select: { id: true, name: true } } },
		});
	}
	catch (error) {
		console.log("Failed to update review status:", error);
		throw new Error("Could not update review status");
	}
}