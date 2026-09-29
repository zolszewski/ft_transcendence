import { Router } from "express";
import { authLimiter, requireAuth } from "../middleware/auth";
import { getAvatarUrl, getUserByEmail, getUserById, searchUsersByName, setUserAvatar, updateUser } from "../services/user.service";
import { isValidEmail, isValidName, isValidTotpCode } from "../utils/validation";
import { getUploadById, setUploadVisibility } from "../services/upload.service";
import { isOwner } from "../utils/authorization";
import { disableTwoFactor, enableTwoFactor, startTwoFactorSetup, verifyTwoFactorCode } from "../services/twoFactor.service";
import { verifyPassword } from "../services/auth.service";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated" });
	res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: getAvatarUrl(user.avatarId), twoFactorEnabled : user.twoFactorEnabled });
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
	res.json({ id: user.id, name: user.name, avatarUrl: getAvatarUrl(user.avatarId) });
});

router.patch("/me", requireAuth, async (req, res) => {
	const { name, email } = req.body;
	if (!isValidName(name) || !isValidEmail(email))
		return res.status(400).json({ error: "Invalid input" });
	const existingUser = await getUserByEmail(email);
	if (existingUser && ( existingUser.id !== req.session.userId!))
		return res.status(409).json({ error: "Email already in use"});
	const updatedUser = await updateUser(req.session.userId!, { name, email });
	res.json({ id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, avatarUrl: getAvatarUrl(updatedUser.avatarId), twoFactorEnabled: updatedUser.twoFactorEnabled });
});

router.put("/me/avatar", requireAuth, async (req, res) => {
	const { uploadId } = req.body;
	const upload = await getUploadById(uploadId);
	if (!upload)
		return res.status(404).json({ error: "Upload Unavailable" });
	if (!isOwner(upload.ownerId, req.session.userId!))
		return res.status(403).json({ error: "Forbidden"});
	if (!upload.mimeType.startsWith("image/"))
		return res.status(400).json({ error: "Not an image"})
	await setUploadVisibility(uploadId, "PUBLIC");
	const updated = await setUserAvatar(req.session.userId!, uploadId);
	res.json({ id: updated.id, email: updated.email, name: updated.name, avatarUrl: getAvatarUrl(updated.avatarId)});
});

router.post("/me/2fa/setup", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated"});
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
			return res.status(401).json({ error: "Invalid credentials"})
	}
	if (!verifyTwoFactorCode(user.twoFactorSecret, code))
		return res.status(400).json({ error: "Invalid code" });
	await disableTwoFactor(user.id);
	res.json({ twoFactorEnabled: false });
});

export default router;