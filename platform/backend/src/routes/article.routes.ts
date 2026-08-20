import { Router } from "express";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle, updateArticleStatus } from "../services/article.service";
import { isOwner } from "../utils/authorization"
import { requireAuth } from "../middleware/auth";
import { isValidContent, isValidTitle } from "../utils/validation";

const router = Router();

router.get("/", async (req, res) => {
	const articles = await listArticles();
	res.json(articles);
});

router.get("/:id", async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	res.json(article);
});

router.post("/", requireAuth, async (req, res) => {
	const { title, content, abstract } =req.body;
	if(!isValidTitle(title) || !isValidContent(content))
		return res.status(400).json({ error: "Invalid input" });
	const article = await createArticle(req.session.userId!, title, content, abstract);
	res.status(201).json(article);
});

router.put("/:id", requireAuth, async (req, res) => {
	const article = await getArticleById(req.params.id);
	if (!article)
		return res.status(404).json({ error: "Article not found" });
	if (!isOwner(article.authorId, req.session.userId!))
		return res.status(403).json({ error: "Forbidden" });
	const { title, content, abstract } = req.body;
	if (!isValidTitle(title) || !isValidContent(content))
		return res.status(400).json({ error: "Invalid input" });
	const updated = await updateArticle(req.params.id, { title, content, abstract });
	res.json(updated);
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

export default router;