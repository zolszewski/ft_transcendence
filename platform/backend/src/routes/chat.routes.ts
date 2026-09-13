import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserById } from "../services/user.service";
import { listMessages, sendMessage } from "../services/chat.service";
import { isValidContent } from "../utils/validation";

const router = Router();
const MAX_MESSAGE_LENGTH = 2000;

router.get("/:userId", requireAuth, async (req, res) => {
	const currentUserId = req.session.userId!;
	const otherUserId = req.params.userId;

	if (currentUserId === otherUserId)
		return res.status(400).json({ error: "You cannot chat with yourself" });
	const otherUser = await getUserById(otherUserId);
	if (!otherUser)
		return res.status(404).json({ error: "User not found" });

	const messages = await listMessages(currentUserId, otherUserId);
	res.json(messages);
});

router.post("/:userId", requireAuth, async (req, res) => {
	const currentUserId = req.session.userId!;
	const otherUserId = req.params.userId;
	const { content } = req.body;

	if (currentUserId === otherUserId)
		return res.status(400).json({ error: "You cannot message yourself" });
	if (!isValidContent(content) || content.trim().length > MAX_MESSAGE_LENGTH)
		return res.status(400).json({ error: "Invalid message content" });

	const otherUser = await getUserById(otherUserId);
	if (!otherUser)
		return res.status(404).json({ error: "User not found" });

	const message = await sendMessage(currentUserId, otherUserId, content);
	res.status(201).json(message);
});

export default router;