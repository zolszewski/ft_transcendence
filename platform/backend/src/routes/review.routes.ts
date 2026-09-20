import { Router } from "express";
import { getReviewById, updateReviewStatus } from "../services/review.service";
import { getArticleById, updateArticleStatus } from "../services/article.service";
import { isOwner } from "../utils/authorization";
import { requireAuth }from "../middleware/auth"


const router = Router();

router.get("/:id", async (req, res) => {
	if (!req.session?.userId)
		return res.status(403).json({ error: "Forbidden" });
	if (isOwner(req.params.id, req.session.userId!))
		return res.status(403).json({ error: "You cannot review your own article" });
	const getArticleToReview = await getArticleById(req.params.id);
	if (!getArticleToReview)
		return res.status(404).json({ error: "Article not found" });
	res.json(getArticleToReview);
});

router.patch("/:id", requireAuth, async (req, res) => {
	const review = await getReviewById(req.params.id);
	if (!review)
		return res.status(404).json({ error: "Review not found" });
	if (!isOwner(review.reviewerId, req.session.userId!)) 
		return res.status(403).json({ error: "Forbidden" });
	if (review.status !== "PENDING")
		return res.status(409).json({ error: "Review already decided" });
	const { decision } = req.body;
	if (decision !== "APPROVED" && decision !== "REJECTED")
		return res.status(400).json({ error: "Invalid decision" });
	const updatedReview = await updateReviewStatus(req.params.id, decision);
	const articleStatus = decision === "APPROVED" ? "PUBLISHED" : "REJECTED";
	await updateArticleStatus(review.articleId, articleStatus);
	res.json(updatedReview);
});

export default router;