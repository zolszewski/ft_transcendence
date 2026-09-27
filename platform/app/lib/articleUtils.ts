import type { Article } from "@/lib/types";

export function getArticleMiniatureUrl(article: Article): string | null {
  const withUrl = article as Article & { miniatureUrl?: string | null };
  return withUrl.miniatureUrl ?? article.miniature;
}
