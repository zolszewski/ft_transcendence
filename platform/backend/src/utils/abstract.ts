function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/** First complete sentence from article body (ends at the first "."). */
export function abstractFromContent(content: string): string {
	const text = stripHtml(content).replace(/\s+/g, " ").trim();
	if (!text) return "";
	const periodIndex = text.indexOf(".");
	if (periodIndex === -1) return text;
	return text.slice(0, periodIndex + 1).trim();
}

export function resolveArticleAbstract(
	content: string,
	abstract: unknown,
): string | undefined {
	if (typeof abstract === "string" && abstract.trim()) {
		return abstract.trim();
	}
	const derived = abstractFromContent(content);
	return derived || undefined;
}
