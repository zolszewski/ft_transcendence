
"use client";

import type { Article } from "@/lib/types";
import { getArticleMiniatureFocus, getArticleMiniatureUrl } from "@/lib/articleUtils";
import ArticleMiniature from "@/components/ArticleMiniature";
import ArticlePreviewContent from "@/components/ArticlePreviewContent";
import NavLink from "@/components/NavLink";
import { Card, CardFooter } from "@/components/ui/card";

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const miniatureUrl = getArticleMiniatureUrl(article);
  const miniatureFocus = getArticleMiniatureFocus(article);
  const articleWithCounts = article as Article & {
    reviewCount?: number;
    commentCount?: number;
  };

  return (
    <Card className="overflow-hidden rounded-none py-0">
      {miniatureUrl ? (
        <ArticleMiniature
          src={miniatureUrl}
          title={article.title}
          size="thumb"
          className="rounded-none"
          focus={miniatureFocus}
        />
      ) : null}

      <ArticlePreviewContent article={article} showAuthor={false}>
        <p className="mt-2 text-xs text-muted-foreground">
          Status: <strong className="text-foreground">{article.status}</strong>
        </p>
        {article.status === "SUBMITTED" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Reviews: {articleWithCounts.reviewCount ?? 0}
          </p>
        ) : null}
        {article.status === "PUBLISHED" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Comments: {articleWithCounts.commentCount ?? 0}
          </p>
        ) : null}
      </ArticlePreviewContent>

      <CardFooter className="gap-2 border-t border-border bg-transparent px-4 pb-4">
        <NavLink href={`/dashboard/${article.id}`} size="sm">
          View
        </NavLink>
        {(article.status === "DRAFT" || article.status === "REJECTED") && (
          <NavLink href={`/dashboard/articles/${article.id}/edit`} size="sm">
            Edit
          </NavLink>
        )}
      </CardFooter>
    </Card>
  );
}
