import type { Article } from "@/lib/types";

type ArticleMedia = Article & {
  miniatureUrl?: string | null;
  miniatureId?: string | null;
  pdfId?: string | null;
};

export function getArticleMiniatureUrl(article: Article): string | null {
  const media = article as ArticleMedia;
  if (media.miniatureUrl) return media.miniatureUrl;
  if (media.miniatureId) return `/api/uploads/${media.miniatureId}`;
  return article.miniature;
}

export function getArticlePdfUrl(article: Article): string | null {
  const media = article as ArticleMedia;
  if (article.pdfUrl) return article.pdfUrl;
  if (media.pdfId) return `/api/uploads/${media.pdfId}`;
  return null;
}

export function hasStoredMiniature(article: Article): boolean {
  const media = article as ArticleMedia;
  return Boolean(media.miniatureId);
}

export function hasStoredPdf(article: Article): boolean {
  const media = article as ArticleMedia;
  return Boolean(media.pdfId);
}

export type MiniatureFocus = { x: number; y: number };

export function getArticleMiniatureFocus(article: Article): MiniatureFocus {
  return {
    x: article.miniatureFocusX ?? 50,
    y: article.miniatureFocusY ?? 50,
  };
}