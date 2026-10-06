import type { Article } from "@/lib/types";

type ArticleMedia = Article & {
  miniatureUrl?: string | null;
  miniatureId?: string | null;
  documentId?: string | null;
};

export function getArticleMiniatureUrl(article: Article): string | null {
  const media = article as ArticleMedia;
  if (media.miniatureUrl) return media.miniatureUrl;
  if (media.miniatureId) return `/api/uploads/${media.miniatureId}`;
  return article.miniature;
}

export function getArticlePdfUrl(article: Article): string | null {
  const media = article as ArticleMedia;
  if (article.documentUrl) return article.documentUrl;
  if (media.documentId) return `/api/articles/${article.id}/document`;
  return null;
}

export function hasStoredMiniature(article: Article): boolean {
  const media = article as ArticleMedia;
  return Boolean(media.miniatureId);
}

export function hasStoredPdf(article: Article): boolean {
  const media = article as ArticleMedia;
  return Boolean(media.documentId);
}

export type MiniatureFocus = { x: number; y: number };

export function getArticleMiniatureFocus(article: Article): MiniatureFocus {
  return {
    x: article.miniatureFocusX ?? 50,
    y: article.miniatureFocusY ?? 50,
  };
}