"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";
import { getArticleMiniatureUrl } from "@/lib/articleUtils";

type ArticleCarouselSectionProps = {
  title: string;
  articles: Article[];
  getArticleHref: (article: Article) => string;
};

export default function ArticleCarouselSection({ title, articles, getArticleHref }: ArticleCarouselSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {articles.map((article) => {
          const miniatureUrl = getArticleMiniatureUrl(article);
          return (
            <Link
              key={article.id}
              href={getArticleHref(article)}
              className="flex w-48 shrink-0 flex-col gap-2 border p-3 hover:bg-gray-50"
            >
              {miniatureUrl ? (
                <img src={miniatureUrl} alt={article.title} className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 w-full bg-gray-100" />
              )}
              <p className="line-clamp-2 text-sm font-semibold">{article.title}</p>
              <p className="text-xs text-muted-foreground">{article.author.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}