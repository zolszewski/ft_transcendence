import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";

authenticator.options = { window: 1 };

export async function startTwoFactorSetup(userId: string, email: string) {
	try {
		const secret = authenticator.generateSecret();
		await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
		const otpauthUrl = authenticator.keyuri(email, "Transcendence", secret);
		const qrCode = await QRCode.toDataURL(otpauthUrl);
		return { otpauthUrl, qrCode };
	}
	catch (error) {
		console.error("Failed to start 2FA setup:", error);
		throw new Error("Could not start 2FA setup");
	}
}

export function verifyTwoFactorCode(secret: string, code: string): boolean {
	return authenticator.check(code, secret);
}

export async function enableTwoFactor(userId: string) {
	try {
		await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
	}
	catch (error) {
		console.error("Failed to enable 2FA:", error);
		throw new Error("Could not enable 2FA");
	}
}

export async function disableTwoFactor(userId: string) {
	try {
		await prisma.user.update({
			where: { id: userId },
			data: { twoFactorEnabled: false, twoFactorSecret: null },
		});
	}
	catch (error) {
		console.error("Failed to disable 2FA:", error);
		throw new Error("Could not disable 2FA");
	}
}