import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDiscoverRecommendations, getDeepenRecommendations } from "../services/recommendation.service";
import { withComputedUrls } from "../services/article.service";

const router = Router();

router.get("/discover", requireAuth, async (req, res) => {
	const articles = await getDiscoverRecommendations(req.session.userId!);
	res.json(articles.map((a) => withComputedUrls(a, req.session.userId)));
});

router.get("/deepen", requireAuth, async (req, res) => {
	const articles = await getDeepenRecommendations(req.session.userId!);
	res.json(articles.map((a) => withComputedUrls(a, req.session.userId)));
});

export default router;