import multer from "multer";
import path from "path";
import { allowedFileMimeTypes } from "../utils/validation";

const storage = multer.diskStorage({
	destination: "/app/uploads",
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, unique);
	},
});

export const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		cb(null, allowedFileMimeTypes.includes(file.mimetype));
	},
});
