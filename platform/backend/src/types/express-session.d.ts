import "express-session";

declare module "express-session" {
	interface SessionData {
		userId: string;
		pending2faUserId: string;
		pending2faAt: number;
		oauthState: string;
	}
}
