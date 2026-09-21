"use client";

import ArticleCard from "./articleCard";
import type { Article } from "@/lib/types";

type ArticleSectionProps = {
  title: string;
  articles: Article[];
};

export default function ArticleSection({
  title,
  articles,
}: ArticleSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {title}
        </h2>

        <span className="text-sm text-gray-500">
          {articles.length}
        </span>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-gray-500">
          No articles.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
            />
          ))}
        </div>
      )}
    </section>
  );
}