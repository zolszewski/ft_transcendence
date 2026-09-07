import { fileTypeFromFile } from "file-type";
import fs from "fs/promises";
import { prisma } from "../lib/prisma";
import { UploadVisibility } from "@prisma/client";
import { allowedFileMimeTypes } from "../utils/validation";


export async function isValidFileFormat(filePath: string): Promise<boolean> {
	try {
		const detected = await fileTypeFromFile(filePath);
		if (!detected)
			return false;
		return allowedFileMimeTypes.includes(detected.mime);
	}
	catch (error) {
		console.error("Failed to detect file type:", error);
		return false;
	}
}

export async function createUpload(ownerId: string, filename: string, originalName: string, mimeType: string, size: number, visibility: UploadVisibility = "PRIVATE") {
	try {
		return await prisma.Upload.create({
			data: { ownerId, filename, originalName, mimeType, size, visibility },
		});
	}
	catch (error) {
		console.error("Failed to create upload:", error);
		throw new Error("Could not create upload");
	}
}

export async function getUploadById(id: string) {
	try {
		return await prisma.Upload.findUnique({ where: { id } });
	}
	catch (error) {
		console.error("Failed to fetch upload:", error);
		throw new Error("Could not fetch upload");
	}
}

export async function deleteUpload(id: string, filename: string) {
	try {
		await prisma.Upload.delete({ where: { id } });
		await fs.unlink(`/app/uploads/${filename}`);
	}
	catch (error) {
		console.error("Failed to delete upload:", error);
		throw new Error("Could not delete upload");
	}
}