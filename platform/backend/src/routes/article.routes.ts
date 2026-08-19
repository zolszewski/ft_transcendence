import { Router } from "express";
import { listArticles, getArticleById } from "../services/article.service";

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

export default router;