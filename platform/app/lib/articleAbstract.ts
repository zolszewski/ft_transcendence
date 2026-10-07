import type { Article } from "@/lib/types";

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

export function abstractFromContent(content: string): string {
  const text = stripHtml(content).replace(/\s+/g, " ").trim();
  if (!text) return "";
  const periodIndex = text.indexOf(".");
  if (periodIndex === -1) return text;
  return text.slice(0, periodIndex + 1).trim();
}

export function getArticleDisplayAbstract(article: Article): string | null {
  const fromContent = abstractFromContent(article.content);
  if (fromContent) return fromContent;
  const stored = article.abstract?.trim();
  return stored || null;
}
