"use client";

import type { Article } from "@/lib/types";
import { FileText } from "lucide-react";
import {
  getArticleMiniatureFocus,
  getArticleMiniatureUrl,
  getArticlePdfUrl,
} from "@/lib/articleUtils";
import ArticleBody from "@/components/ArticleBody";
import ArticleMiniature from "@/components/ArticleMiniature";

type ArticleDetailViewProps = {
  article: Article;
  showAuthorByline?: boolean;
  showAuthorInFooter?: boolean;
};

export default function ArticleDetailView({
  article,
  showAuthorByline = true,
  showAuthorInFooter = true,
}: ArticleDetailViewProps) {
  const miniatureUrl = getArticleMiniatureUrl(article);
  const miniatureFocus = getArticleMiniatureFocus(article);
  const pdfUrl = getArticlePdfUrl(article);

  return (
    <article className="article-detail">
      {miniatureUrl ? (
        <ArticleMiniature
          src={miniatureUrl}
          title={article.title}
          size="hero"
          focus={miniatureFocus}
        />
      ) : null}

      <header>
        <h1 className="article-title">{article.title}</h1>
        {showAuthorByline ? (
          <p className="article-byline">by {article.author.name}</p>
        ) : null}
        {article.abstract ? (
          <p className="article-abstract">{article.abstract}</p>
        ) : null}
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="article-pdf-link mt-2 inline-flex items-center gap-2 border px-4 py-2 text-sm hover:bg-gray-50"
          >
            <FileText size={16} aria-hidden="true" />
            View PDF
          </a>
        ) : null}
      </header>

      <ArticleBody html={article.content} />

      <footer className="article-meta-footer">
        {showAuthorInFooter ? <>By {article.author.name} · </> : null}
        Edited on {new Date(article.updatedAt).toLocaleDateString()}
      </footer>
    </article>
  );
}