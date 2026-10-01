const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL!;

export function getGithubAuthorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: GITHUB_CALLBACK_URL,
		scope: "user:email",
		state,
	});
	return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGithubCode(code: string): Promise<string> {
	const response = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: { "Content-Type": "application/json", "Accept": "application/json" },
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: GITHUB_CALLBACK_URL,
		}),
	});
	const data = await response.json();
	if (!data.access_token)
		throw new Error("Github token exchange failed");
	return data.access_token as string;
}

export async function fetchGithubProfile(accessToken: string) {
	const headers = { Authorization: `Bearer ${accessToken}`, "User-Agent": "Transcendence-App" };
	const profileRes = await fetch("https://api.github.com/user", { headers });
	const profile = await profileRes.json();
	let email = profile.email;
	if (!email) {
		const emailRes = await fetch("https://api.github.com/user/emails", {headers});
		const emails = await emailRes.json();
		email = emails.find((e: any) => e.primary && e.verified)?.email;
	}
	if (!email)
		throw new Error("No verified email from GitHub");
	return { id: String(profile.id), email, name: profile.name || profile.login };
}