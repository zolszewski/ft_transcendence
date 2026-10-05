import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getIO } from "../lib/socket";
import {
	acceptFriendRequest,
	getRelationStatus,
	listFriends,
	listIncomingRequests,
	removeFriendship,
	sendFriendRequest,
} from "../services/friend.service";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
	const friends = await listFriends(req.session.userId!);
	res.json(friends);
});

router.get("/requests", requireAuth, async (req, res) => {
	const requests = await listIncomingRequests(req.session.userId!);
	res.json(requests);
});

router.get("/status/:userId", requireAuth, async (req, res) => {
	const status = await getRelationStatus(req.session.userId!, req.params.userId);
	res.json({ status });
});

router.post("/:userId", requireAuth, async (req, res) => {
	const currentUserId = req.session.userId!;
	const otherUserId = req.params.userId;
	try {
		const row = await sendFriendRequest(currentUserId, otherUserId);
		const accepted = row.status === "ACCEPTED";
		getIO()
			.to(`user:${otherUserId}`)
			.emit(accepted ? "friend:accepted" : "friend:request", {
				userId: currentUserId,
				otherUserId,
			});
		if (accepted) {
			getIO().to(`user:${currentUserId}`).emit("friend:accepted", {
				userId: otherUserId,
				otherUserId: currentUserId,
			});
		}
		res.status(accepted ? 200 : 201).json({ status: await getRelationStatus(currentUserId, otherUserId) });
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "SELF") return res.status(400).json({ error: "You cannot add yourself" });
		if (message === "NOT_FOUND") return res.status(404).json({ error: "User not found" });
		if (message === "ALREADY_FRIENDS") return res.status(409).json({ error: "Already friends" });
		if (message === "ALREADY_PENDING") return res.status(409).json({ error: "Request already sent" });
		throw error;
	}
});

router.put("/:userId", requireAuth, async (req, res) => {
	const currentUserId = req.session.userId!;
	const otherUserId = req.params.userId;
	try {
		await acceptFriendRequest(currentUserId, otherUserId);
		getIO()
			.to(`user:${otherUserId}`)
			.to(`user:${currentUserId}`)
			.emit("friend:accepted", { userId: currentUserId, otherUserId });
		res.json({ status: "friends" });
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "NOT_FOUND") return res.status(404).json({ error: "No pending request" });
		throw error;
	}
});

router.delete("/:userId", requireAuth, async (req, res) => {
	const currentUserId = req.session.userId!;
	const otherUserId = req.params.userId;
	try {
		await removeFriendship(currentUserId, otherUserId);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "NOT_FOUND") return res.status(404).json({ error: "No friendship found" });
		throw error;
	}
});

export default router;
