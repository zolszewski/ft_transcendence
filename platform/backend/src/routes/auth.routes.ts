import { Router } from "express";
import { createUser, getUserByEmail, getUserById } from "../services/user.service";
import { hashPassword, verifyPassword } from "../services/auth.service";
import { isValidEmail, isValidPassword, isValidName } from "../utils/validation";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
	const { email, password } = req.body;
	console.log("LOGIN REQUEST:");
	console.log("email: ", email);
	console.log("password: ", password);
	if (!isValidEmail(email) || !isValidPassword(password))
		return res.status(400).json({ error: "Invalid input" });
	const user = await getUserByEmail(email);
	console.log("USERFOUND", user);
	if (!user) {
		console.log("USERNOTFOUND");
		return res.status(401).json({ error: "Invalid credentials" });
	}
	const passwordMatches = await verifyPassword(password, user.password);
	console.log("pass match : ", passwordMatches);
	if (!passwordMatches) {
		console.log("Passowrd not matching");
		return res.status(401).json({ error: "Invalid credentials" });
	}
	req.session.userId = user.id;
	res.json({ id: user.id, email: user.email, name: user.name });
});

router.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err)
			return res.status(500).json({ error: "Could not log out" });
		res.clearCookie("connect.sid");
		res.json({ success: true });
	});
});

router.get("/me", requireAuth, async (req, res) => {
	const user = await getUserById(req.session.userId!);
	if (!user)
		return res.status(401).json({ error: "Not authenticated" });
	res.json({ id: user.id, email: user.email, name: user.name });
});

export default router;