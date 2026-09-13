import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getOtherUsers } from "../services/user.service";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
	const users = await getOtherUsers(req.session.userId!);
	res.json(users);
});

export default router;