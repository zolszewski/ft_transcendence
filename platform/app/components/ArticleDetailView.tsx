"use client";

import type { Article } from "@/lib/types";
import { getArticleMiniatureUrl } from "@/lib/articleUtils";
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

  return (
    <>
      {miniatureUrl ? (
        <ArticleMiniature src={miniatureUrl} title={article.title} size="hero" />
      ) : null}

      <h1 className="article-title">{article.title}</h1>

      {showAuthorByline ? (
        <p className="article-byline">by {article.author.name}</p>
      ) : null}

      {article.abstract ? (
        <p className="article-abstract">{article.abstract}</p>
      ) : null}

      <ArticleBody html={article.content} />

      <p className="article-meta-footer">
        {showAuthorInFooter ? <>By {article.author.name} · </> : null}
        Edited on {new Date(article.updatedAt).toLocaleDateString()}
      </p>
    </>
  );
}
