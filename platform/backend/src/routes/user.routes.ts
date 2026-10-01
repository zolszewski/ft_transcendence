import { Router } from "express";
import { authLimiter, requireAuth } from "../middleware/auth";
import { verifyPassword } from "../services/auth.service";
import {
	disableTwoFactor,
	enableTwoFactor,
	startTwoFactorSetup,
	verifyTwoFactorCode,
} from "../services/twoFactor.service";
import { getAvatarUrl, getOtherUsers, getUserByEmail, getUserById, searchUsersByName, setUserAvatar, updateUser } from "../services/user.service";
import { isValidEmail, isValidName, isValidTotpCode } from "../utils/validation";
import { getUploadById, setUploadVisibility } from "../services/upload.service";
import { isOwner } from "../utils/authorization";

const router = Router();

async function attachAvatarFromUploadId(userId: string, uploadId: string) {
	const upload = await getUploadById(uploadId);
	if (!upload)
		throw new Error("UPLOAD_NOT_FOUND");
	if (!isOwner(upload.ownerId, userId))
		throw new Error("FORBIDDEN");
	if (!upload.mimeType.startsWith("image/"))
		throw new Error("NOT_IMAGE");
	await setUploadVisibility(uploadId, "PUBLIC");
	return setUserAvatar(userId, uploadId);
}

// liste des autres utilisateurs (choix du destinataire dans le chat)
router.get("/", requireAuth, async (req, res) => {
	const users = await getOtherUsers(req.session.userId!);
	res.json(users);
});

router.get("/me", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated" });
	res.json({
		id: user.id,
		email: user.email,
		name: user.name,
		faculty: user.faculty,
		specialization: user.specialization,
		avatarId: user.avatarId,
		avatarUrl: getAvatarUrl(user.avatarId),
		createdAt: user.createdAt,
	});
});


router.get("/search", requireAuth, async (req, res) => {
	const { q } = req.query;
	if (typeof q !== "string" || q.trim().length === 0)
		return res.json([]);
	const users = await searchUsersByName(q, req.session.userId!);
	res.json(users.map(u => ({ id: u.id, name: u.name, avatarUrl: getAvatarUrl(u.avatarId) })));
});


router.get("/:id", async (req, res) => {
	const user = await getUserById(req.params.id);
	if (!user)
		return res.status(404).json({ error: "User not found" });
	res.json({
		id: user.id,
		name: user.name,
		faculty: user.faculty,
		specialization: user.specialization,
		avatarUrl: getAvatarUrl(user.avatarId),
	});
});

router.patch("/me", requireAuth, async (req, res) => {
	const currentUser = await getUserById(req.session.userId!);
	if (!currentUser)
		return res.status(401).json({ error: "Not authenticated" });

	const { name, email, faculty, specialization, avatarId } = req.body;
	const nextName = name !== undefined ? name : currentUser.name;
	const nextEmail = email !== undefined ? email : currentUser.email;

	if (!isValidName(nextName) || !isValidEmail(nextEmail))
		return res.status(400).json({ error: "Invalid input" });
	if (faculty !== undefined && faculty !== null && typeof faculty !== "string")
		return res.status(400).json({ error: "Invalid faculty" });
	if (specialization !== undefined && specialization !== null && typeof specialization !== "string")
		return res.status(400).json({ error: "Invalid specialization" });
	if (avatarId !== undefined && avatarId !== null && typeof avatarId !== "string")
		return res.status(400).json({ error: "Invalid avatar" });

	const existingUser = await getUserByEmail(nextEmail);
	if (existingUser && existingUser.id !== req.session.userId!)
		return res.status(409).json({ error: "Email already in use" });

	try {
		let updatedUser = await updateUser(req.session.userId!, {
			name: nextName,
			email: nextEmail,
			faculty: faculty !== undefined ? (faculty ?? null) : currentUser.faculty,
			specialization:
				specialization !== undefined
					? (specialization ?? null)
					: currentUser.specialization,
		});

		if (typeof avatarId === "string" && avatarId.length > 0) {
			updatedUser = await attachAvatarFromUploadId(req.session.userId!, avatarId);
		}

		res.json({
			id: updatedUser.id,
			email: updatedUser.email,
			name: updatedUser.name,
			faculty: updatedUser.faculty,
			specialization: updatedUser.specialization,
			avatarId: updatedUser.avatarId,
			avatarUrl: getAvatarUrl(updatedUser.avatarId),
			createdAt: updatedUser.createdAt,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "UPLOAD_NOT_FOUND")
			return res.status(404).json({ error: "Upload Unavailable" });
		if (message === "FORBIDDEN")
			return res.status(403).json({ error: "Forbidden" });
		if (message === "NOT_IMAGE")
			return res.status(400).json({ error: "Not an image" });
		throw error;
	}
});

router.put("/me/avatar", requireAuth, async (req, res) => {
	const { uploadId } = req.body;
	if (typeof uploadId !== "string" || !uploadId)
		return res.status(400).json({ error: "Invalid input" });
	try {
		const updated = await attachAvatarFromUploadId(req.session.userId!, uploadId);
		res.json({
			id: updated.id,
			email: updated.email,
			name: updated.name,
			faculty: updated.faculty,
			specialization: updated.specialization,
			avatarId: updated.avatarId,
			avatarUrl: getAvatarUrl(updated.avatarId),
			createdAt: updated.createdAt,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "UPLOAD_NOT_FOUND")
			return res.status(404).json({ error: "Upload Unavailable" });
		if (message === "FORBIDDEN")
			return res.status(403).json({ error: "Forbidden" });
		if (message === "NOT_IMAGE")
			return res.status(400).json({ error: "Not an image" });
		throw error;
	}
});

router.post("/me/2fa/setup", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated" });
	if (user.twoFactorEnabled)
		return res.status(409).json({ error: "2FA already enabled" });
	const { otpauthUrl, qrCode } = await startTwoFactorSetup(user.id, user.email);
	res.json({ otpauthUrl, qrCode });
});

router.post("/me/2fa/enable", requireAuth, authLimiter, async (req, res) => {
	const { code } = req.body;
	if (!isValidTotpCode(code))
		return res.status(400).json({ error: "Invalid input" });
	const user = await getUserById(req.session.userId!);
	if (!user || !user.twoFactorSecret)
		return res.status(400).json({ error: "2FA setup not started" });
	if (user.twoFactorEnabled)
		return res.status(409).json({ error: "2FA already enabled" });
	if (!verifyTwoFactorCode(user.twoFactorSecret, code))
		return res.status(400).json({ error: "Invalid code" });
	await enableTwoFactor(user.id);
	res.json({ twoFactorEnabled: true });
});

router.post("/me/2fa/disable", requireAuth, authLimiter, async (req, res) => {
	const { password, code } = req.body;
	if (!isValidTotpCode(code))
		return res.status(400).json({ error: "Invalid input" });
	const user = await getUserById(req.session.userId!);
	if (!user || !user.twoFactorEnabled || !user.twoFactorSecret)
		return res.status(400).json({ error: "2FA not enabled" });
	if (user.password) {
		if (typeof password !== "string" || !(await verifyPassword(password, user.password)))
			return res.status(401).json({ error: "Invalid credentials" });
	}
	if (!verifyTwoFactorCode(user.twoFactorSecret, code))
		return res.status(400).json({ error: "Invalid code" });
	await disableTwoFactor(user.id);
	res.json({ twoFactorEnabled: false });
});

export default router;
