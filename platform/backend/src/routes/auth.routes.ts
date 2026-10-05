import { Router } from "express";
import { redisClient } from "../lib/redis";
import { createUser, getUserByEmail, getUserById } from "../services/user.service";
import { hashPassword, verifyPassword } from "../services/auth.service";
import { isValidEmail, isValidPassword, isValidName, isValidTotpCode } from "../utils/validation";
import { authLimiter, requireAuth } from "../middleware/auth";
import { createApiKey } from "../services/apiKey.service";
import { verifyTwoFactorCode } from "../services/twoFactor.service";
import crypto from "crypto";
import { getGithubAuthorizeUrl, exchangeGithubCode, fetchGithubProfile } from "../services/github.service";
import { createOAuthUser, getUserByOAuth } from "../services/user.service";



const router = Router();
router.post("/register", authLimiter, async (req, res) => {
	const { email, name, password } = req.body;
	if (!isValidEmail(email) || !isValidPassword(password) || !isValidName(name))
		return res.status(400).json({ error: "Invalid input" });
	const existingUser = await getUserByEmail(email);
	if (existingUser)
		return res.status(409).json({ error: "Email already in use"});
	const hashedPassword = await hashPassword(password);
	const user = await createUser(email, name, hashedPassword);
	req.session.userId = user.id;
	res.status(201).json({ id: user.id, email: user.email, name: user.name })
});

router.post("/login", authLimiter, async (req, res) => {
	const { email, password } = req.body;
	if (!isValidEmail(email) || !isValidPassword(password))
		return res.status(400).json({ error: "Invalid input" });
	const user = await getUserByEmail(email);
	if (!user)
		return res.status(401).json({ error: "Invalid credentials" });
	if (!user.password)
		return res.status(401).json({ error: "Invalid credentials" });
	const passwordMatches = await verifyPassword(password, user.password);
	if (!passwordMatches)
		return res.status(401).json({ error: "Invalid credentials" });
	if (user.twoFactorEnabled) {
		req.session.pending2faUserId = user.id;
		req.session.pending2faAt = Date.now();
		return res.json({ requires2fa: true });
	}
	req.session.userId = user.id;
	res.json({ id: user.id, email: user.email, name: user.name });
});

const PENDING_2FA_TTL_MS = 5 * 60 * 1000;
router.post("/login/2fa", authLimiter, async (req, res) => {
	const { code } = req.body;
	const userId = req.session.pending2faUserId;
	const startedAt = req.session.pending2faAt;
	if (!userId || !startedAt || Date.now() - startedAt > PENDING_2FA_TTL_MS)
		return res.status(401).json({ error: "No pending login" });
	if (!isValidTotpCode(code))
		return res.status(400).json({ error: "Invalid input" });
	const user = await getUserById(userId);
	if (!user || !user.twoFactorSecret)
		return res.status(401).json({ error: "No pending login" });
	if (!verifyTwoFactorCode(user.twoFactorSecret, code))
		return res.status(401).json({ error: "Invalid code" });
	delete req.session.pending2faUserId;
	delete req.session.pending2faAt;
	req.session.userId = user.id;
	res.json({ id: user.id, email: user.email, name: user.name });
});


router.post("/logout", async (req, res) => {
	const userId = req.session.userId;
	if (userId)
		await redisClient.sRem("online_users", userId);
	req.session.destroy((err) => {
		if (err)
			return res.status(500).json({ error: "Could not log out" });
		res.clearCookie("connect.sid");
		res.json({ success: true });
	});
});

router.post("/api-keys", requireAuth, async (req, res) => {
	const apiKey = await createApiKey(req.session.userId!);
	res.status(201).json({ apiKey });
})

router.get("/me", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated" });
	res.json({ id: user.id, email: user.email, name: user.name });
});

router.get("/oauth/github", (req, res) => {
	const state = crypto.randomBytes(16).toString("hex");
	req.session.oauthState = state;
	res.redirect(getGithubAuthorizeUrl(state));
});

router.get("/oauth/github/callback", async (req, res) => {
	const { code, state } = req.query;
	if (typeof code !== "string" || typeof state !== "string" || state !== req.session.oauthState)
		return res.status(400).json({ error: "Invalid OAuth callback" });
	delete req.session.oauthState;

	let profile;
	try {
		const accessToken = await exchangeGithubCode(code);
		profile = await fetchGithubProfile(accessToken);
	} catch (error) {
		console.error("GitHub OAuth failed:", error);
		return res.status(400).json({ error: "GitHub authentication failed" });
	}

	let user = await getUserByOAuth("github", profile.id);
	if (!user) {
		const existing = await getUserByEmail(profile.email);
		if (existing)
			return res.status(409).json({ error: "An account with this email already exists. Log in with your password instead." });
		user = await createOAuthUser(profile.email, profile.name, "github", profile.id);
	}

	if (user.twoFactorEnabled) {
		req.session.pending2faUserId = user.id;
		req.session.pending2faAt = Date.now();
		return res.redirect("/authentication/login?pending2fa=1");
	}
	req.session.userId = user.id;
	res.redirect("/");
});

export default router;