import { Router } from "express";
import fs from "fs/promises";
import { upload } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";
import { isOwner } from "../utils/authorization";
import { createUpload, deleteUpload, getUploadById, isValidFileFormat } from "../services/upload.service";



const router = Router();

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
	if (!req.file)
		return res.status(400).json({ error: "No file provided" });
	const validFormat = await isValidFileFormat(req.file.path);
	if (!validFormat) {
		await fs.unlink(req.file.path);
		return res.status(400).json({ error: "Invalid file format" });
	}
	const visibility = req.body.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
	const uploadRecord = await createUpload(
		req.session.userId!,
		req.file.filename,
		req.file.originalname,
		req.file.mimetype,
		req.file.size,
		visibility,
	)
	res.status(201).json(uploadRecord);
});

router.get("/:id", async (req, res) => {
	const uploadRecord = await getUploadById(req.params.id);
	if (!uploadRecord)
		return res.status(404).json({ error: "Upload not found" });
	const userId = req.session?.userId;
	if (uploadRecord.visibility === "PRIVATE" && uploadRecord.ownerId !== userId)
		return res.status(403).json({ error: "Forbidden" });
	res.sendFile(`/app/uploads/${uploadRecord.filename}`);
});

router.delete("/:id", requireAuth, async (req, res) => {
	const uploadRecord = await getUploadById(req.params.id);
	if (!uploadRecord)
		return res.status(404).json({ error:"Upload not found" });
	if (!isOwner(uploadRecord.ownerId, req.session.userId!) )
		return res.status(403).json({ error: "Forbidden" });
	await deleteUpload(uploadRecord.id, uploadRecord.filename);
	res.status(204).send();
});

export default router;