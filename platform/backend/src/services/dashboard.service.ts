import { prisma } from "../lib/prisma";

export async function getDashboardStats(userId:string) {
	
	const articleCounts = { DRAFT : 0, SUBMITTED : 0, REJECTED : 0, PUBLISHED : 0 };
	const groupedArticles = await prisma.article.groupBy({
		by: ["status"],
		where: { authorId : userId },
		_count: true,
	});
	for (const entry of groupedArticles) {
		articleCounts[entry.status] = entry._count;
	}

	const reviewCounts = { PENDING : 0, APPROVED : 0, REJECTED : 0 };
	const groupedReviews = await prisma.review.groupBy({
		by: ["status"],
		where: { reviewerId : userId },
		_count: true,
	})
	for (const entry of groupedReviews) {
		reviewCounts[entry.status] = entry._count;
	}

	const decided = articleCounts.PUBLISHED + articleCounts.REJECTED;
	let approvalRate: number | null;
	if (decided > 0)
		approvalRate = Math.round((articleCounts.PUBLISHED / decided) * 100);
	else
		approvalRate = null;

	const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
	const daysSinceJoined = Math.floor((Date.now() - user!.createdAt.getTime()) / (1000 * 60 * 60 * 24));


	return {
		articleCounts,
		reviewCounts,
		approvalRate,
		daysSinceJoined,
	};

}