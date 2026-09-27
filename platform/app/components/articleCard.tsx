
"use client";

import type { Article } from "@/lib/types";
import { getArticleMiniatureUrl } from "@/lib/articleUtils";
import ArticleMiniature from "@/components/ArticleMiniature";
import NavLink from "@/components/NavLink";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type ArticleCardProps = {
  article: Article;
  onDelete?: (id: string) => void;
};

export default function ArticleCard({
  article,
}: ArticleCardProps) {
  const miniatureUrl = getArticleMiniatureUrl(article);

  return (
    <Card className="overflow-hidden py-0">
      {miniatureUrl ? (
        <ArticleMiniature
          src={miniatureUrl}
          title={article.title}
          size="thumb"
          className="rounded-none"
        />
      ) : null}

      <CardContent className="pt-4">
        <h3 className="font-bold">{article.title}</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(article.createdAt).toLocaleDateString()}
        </p>

        {article.abstract ? (
          <p className="mt-2 text-sm">{article.abstract}</p>
        ) : null}

        <p className="mt-2 text-xs">
          Status: <strong>{article.status}</strong>
        </p>

        {article.status === "SUBMITTED" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Reviews: {(article as Article & { reviewCount?: number }).reviewCount ?? 0}
          </p>
        )}

        {article.status === "PUBLISHED" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Comments: {(article as Article & { commentCount?: number }).commentCount ?? 0}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t-0 bg-transparent">
        <NavLink href={`/dashboard/${article.id}`} size="sm">
          View
        </NavLink>

        {(article.status === "DRAFT" || article.status === "REJECTED") && (
          <NavLink
            href={`/dashboard/articles/${article.id}/edit`}
            size="sm"
          >
            Edit
          </NavLink>
        )}
      </CardFooter>
    </Card>
  );
}
