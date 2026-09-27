import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";
import { authenticator } from "otplib";

authenticator.options = { window: 1 };

export async function startTwoFactorSetup(userId: string, email: string) {
	const secret = authenticator.generateSecret();
	await prisma.User.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
	const otpauthUrl = authenticator.keyuri(email, "Transcendence", secret);
	const qrCode = await QRCode.toDataURL(otpauthUrl);
	return { otpauthUrl, qrCode };
}

export function verifyTwoFactorCode(secret: string, code: string): boolean {
	return authenticator.check(code, secret);
}

export async function enableTwoFactor(userId: string) {
	await prisma.User.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
}

export async function disableTwoFactor(userId: string) {
	await prisma.User.update({
		where: { id: userId },
		data: { twoFactorEnabled: false, twoFactorSecret: null },
	});
}