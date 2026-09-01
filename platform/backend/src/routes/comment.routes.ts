import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createComment, deleteComment, getCommentById } from "../services/comment.service";
import { isOwner } from "../utils/authorization";

const router = Router();


router.delete("/:id", requireAuth, async (req, res) => {
	const comment = await getCommentById(req.params.id);
	if (!comment)
		return res.status(404).json({ error: "Comment not found" });
	if (!isOwner(comment.authorId, req.session.userId!))
		return res.status(403).json({ error: "Forbidden" });
	await deleteComment(req.params.id);
	res.status(204).send();
})

export default router;