
"use client";

import type { Article } from "@/lib/types";
import { getArticleMiniatureFocus, getArticleMiniatureUrl } from "@/lib/articleUtils";
import ArticleMiniature from "@/components/ArticleMiniature";
import ArticlePreviewContent from "@/components/ArticlePreviewContent";
import NavLink from "@/components/NavLink";
import { Card, CardFooter } from "@/components/ui/card";
import { articleStatusLabel } from "@/lib/articleStatusLabels";

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
          Statut : <strong className="text-foreground">{articleStatusLabel(article.status)}</strong>
        </p>
        {article.status === "SUBMITTED" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Relectures : {articleWithCounts.reviewCount ?? 0}
          </p>
        ) : null}
        {article.status === "PUBLISHED" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Commentaires : {articleWithCounts.commentCount ?? 0}
          </p>
        ) : null}
      </ArticlePreviewContent>

      <CardFooter className="gap-2 border-t border-border bg-transparent px-4 pb-4">
        <NavLink href={`/dashboard/${article.id}`} size="sm">
          Voir
        </NavLink>
        {(article.status === "DRAFT" || article.status === "REJECTED") && (
          <NavLink href={`/dashboard/articles/${article.id}/edit`} size="sm">
            Modifier
          </NavLink>
        )}
      </CardFooter>
    </Card>
  );
}
