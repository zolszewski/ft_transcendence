import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../services/dashboard.service";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
	const dashboard	= await getDashboardStats(req.session.userId!);
	return res.json(dashboard);
})

export default router;