
export const allowedFileMimeTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return typeof email === "string" && emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
	return typeof password === "string" && password.length >= 8;
}

export function isValidName(name: string): boolean {
	return typeof name === "string" && name.trim().length >= 1;
}

export function isValidTitle(title: string): boolean {
	return typeof title === "string" && title.trim().length >= 1;
}

export function isValidContent(content: string): boolean {
	return typeof content === "string" && content.trim().length >= 1;
}