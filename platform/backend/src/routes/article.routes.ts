import { Router } from "express";
import { ArticleStatus } from "@prisma/client";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle, updateArticleStatus, listSubmittedArticlesForReview, listMyArticles, articleWithMediaUrls } from "../services/article.service";
import { isOwner } from "../utils/authorization"
import { requireAuth } from "../middleware/auth";
import { isValidContent, isValidTitle, parseMiniatureFocus } from "../utils/validation";
import { createReview, getReviewByArticleAndReviewer, listReviewsForArticle } from "../services/review.service";
import { createComment, listCommentsForArticle } from "../services/comment.service";
import { getUploadById, setUploadVisibility } from "../services/upload.service";

const router = Router();

router.get("/explore", async (req, res) => {
	const { search, sort, page, limit } = req.query;
	const result = await listArticles({
		search: typeof search === "string" ? search : undefined,
		sort: sort === "oldest" ? "oldest" : "newest",
		page: Math.max(1, Number(page) || 1),
		limit: Math.min(50, Math.max(1, Number(limit) || 10)),
	});
	res.json({ ...result, articles: result.articles.map(articleWithMediaUrls) });
})

router.get("/submitted", requireAuth, async (req, res) => {
	const { search, sort, page, limit } = req.query;
	const result = await listSubmittedArticlesForReview({
		reviewerId: req.session.userId!,
		search: typeof search === "string" ? search : undefined,
		sort: sort === "oldest" ? "oldest" : "newest",
		page: Math.max(1, Number(page) || 1),
		limit: Math.min(50, Math.max(1, Number(limit) || 10)),
	});
	res.json({ ...result, articles: result.articles.map(articleWithMediaUrls) });
});

router.get("/mine", requireAuth, async (req, res) => {
	const { status, search, sort, page, limit } = req.query;
	const validStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"];
	const result = await listMyArticles({
		authorId: req.session.userId!,
		status: validStatuses.includes(status as string) ? (status as ArticleStatus) : undefined,
		search: typeof search === "string" ? search : undefined,
		sort: sort === "oldest" ? "oldest" : "newest",
		page: Math.max(1, Number(page) || 1),
		limit: Math.min(50, Math.max(1, Number(limit) || 10)),
	});
	res.json({ ...result, articles: result.articles.map(articleWithMediaUrls) });
});

router.get("/:id", async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (article.status === "PUBLISHED")
		return res.json(articleWithMediaUrls(article));
	const userId = req.session?.userId;
	if (!userId)
		return res.status(404).json({ error: "Article not found" });
	if (isOwner(article.authorId, userId))
		return res.json(articleWithMediaUrls(article));
	if (article.status === "SUBMITTED")
		return res.json(articleWithMediaUrls(article));
	return res.status(404).json({ error: "Article not found" });
});

router.post("/", requireAuth, async (req, res) => {
	const { title, content, abstract, miniatureId, pdfId } = req.body;
	const focus = parseMiniatureFocus(req.body);
	if(!isValidTitle(title) || !isValidContent(content))
		return res.status(400).json({ error: "Invalid input" });
	if (focus === null)
		return res.status(400).json({ error: "Invalid miniature focus" });
	if (miniatureId) {
		const upload = await getUploadById(miniatureId);
		if (!upload)
			return res.status(404).json({ error: "Upload not found" });
		if (!isOwner(upload.ownerId, req.session.userId!))
			return res.status(403).json({ error: "Forbidden" });
		if (!upload.mimeType.startsWith("image/"))
			return res.status(400).json({ error: "Not an image" });
		await setUploadVisibility(miniatureId, "PUBLIC");
	}
	if (pdfId) {
        const upload = await getUploadById(pdfId);
        if (!upload)
            return res.status(404).json({ error: "Upload not found" });
        if (!isOwner(upload.ownerId, req.session.userId!))
            return res.status(403).json({ error: "Forbidden" });
        if (upload.mimeType !== "application/pdf")
            return res.status(400).json({ error: "Not a PDF" });
        await setUploadVisibility(pdfId, "PUBLIC");
    }
	const article = await createArticle(
		req.session.userId!,
		title,
		content,
		abstract,
		miniatureId,
		pdfId,
		focus?.miniatureFocusX ?? 50,
		focus?.miniatureFocusY ?? 50,
	);
	res.status(201).json(articleWithMediaUrls(article));
});

router.put("/:id", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (!isOwner(article.authorId, req.session.userId!))
		return res.status(403).json({ error: "Forbidden" });
	const { title, content, abstract, miniatureId, pdfId } = req.body;
	const focus = parseMiniatureFocus(req.body);
	if (!isValidTitle(title) || !isValidContent(content))
		return res.status(400).json({ error: "Invalid input" });
	if (focus === null)
		return res.status(400).json({ error: "Invalid miniature focus" });
	if (miniatureId) {
		const upload = await getUploadById(miniatureId);
		if (!upload)
			return res.status(404).json({ error: "Upload not found" });
		if (!isOwner(upload.ownerId, req.session.userId!))
			return res.status(403).json({ error: "Forbidden" });
		if (!upload.mimeType.startsWith("image/"))
			return res.status(400).json({ error: "Not an image" });
		await setUploadVisibility(miniatureId, "PUBLIC");
	}
	if (pdfId) {
        const upload = await getUploadById(pdfId);
        if (!upload)
            return res.status(404).json({ error: "Upload not found" });
        if (!isOwner(upload.ownerId, req.session.userId!))
            return res.status(403).json({ error: "Forbidden" });
        if (upload.mimeType !== "application/pdf")
            return res.status(400).json({ error: "Not a PDF" });
        await setUploadVisibility(pdfId, "PUBLIC");
    }
	const updated = await updateArticle(req.params.id, {
		title,
		content,
		abstract,
		miniatureId,
		pdfId,
		...(focus ?? {}),
	});
	res.json(articleWithMediaUrls(updated));
})

router.delete("/:id", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (!isOwner(article.authorId, req.session.userId!))
		return res.status(403).json( {error: "Forbidden" });
	await deleteArticle(req.params.id);
	res.status(204).send();
});

router.post("/:id/submit", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (!isOwner(article.authorId, req.session.userId!))
		return res.status(403).json({ error: "Forbidden" });
	if (article.status !== "DRAFT")
		return res.status(409).json ({ error: "Article is not a draft" });
	const updated = await updateArticleStatus(req.params.id, "SUBMITTED");
	res.json(updated);
});

router.post("/:id/reviews", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (isOwner(article.authorId, req.session.userId!))
		return res.status(403).json({ error: "You cannot review your own article" });
	if (article.status !== "SUBMITTED")
		return res.status(409).json({ error: "Article is not open for review" });
	const existingReview = await getReviewByArticleAndReviewer(req.params.id, req.session.userId!);
	if (existingReview)
		return res.status(409).json({ error: "You already reviewed this article" });
	const { comment } = req.body;
	const review = await createReview(req.params.id, req.session.userId!, comment);
	res.status(201).json(review);
});

router.post("/:id/comments", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article || article.status !== "PUBLISHED")
		return res.status(404).json({ error: "Article not found" });
	const { content } = req.body;
	if (!isValidContent(content))
		return res.status(400).json({ error: "Invalid input" });
	const comment = await createComment(req.params.id, req.session.userId!, content);
	res.status(201).json(comment);
});

router.get("/:id/reviews", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article) 
		return res.status(404).json({ error: "Article not found" });
	const reviews = await listReviewsForArticle(req.params.id);
	const isReviewer = reviews.some((r) => isOwner(r.reviewerId, req.session.userId!));
	if (!isOwner(article.authorId, req.session.userId!) && !isReviewer)
		return res.status(403).json({ error : "Forbidden" });
	res.json(reviews);
});

router.get("/:id/comments", async (req, res) => {
	const comments = await listCommentsForArticle(req.params.id);
	res.json(comments);
});

export default router;