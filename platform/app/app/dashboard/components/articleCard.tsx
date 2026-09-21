
"use client";

import Link from "next/link";
import type { Article } from "@/lib/types";

type ArticleCardProps = {
  article: Article;
  onDelete?: (id: string) => void;
};

export default function ArticleCard({
  article,
  onDelete,
}: ArticleCardProps) {
  return (
    <article className="border p-4">
      {article.miniatureUrl && (
        <img
          src={article.miniatureUrl}
          alt={`Miniature for ${article.title}`}
          className="h-40 w-full object-cover"
        />
      )}

      <div className="mt-3">
        <h3 className="font-bold">
          {article.title}
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          {new Date(article.createdAt).toLocaleDateString()}
        </p>

        {article.abstract && (
          <p className="mt-2 text-sm">
            {article.abstract}
          </p>
        )}

        <p className="mt-2 text-xs">
          Status: <strong>{article.status}</strong>
        </p>

        {article.status === "SUBMITTED" && (
          <p className="mt-2 text-sm text-gray-600">
            Reviews: {article.reviewCount ?? 0}
          </p>
        )}

        {article.status === "PUBLISHED" && (
          <p className="mt-2 text-sm text-gray-600">
            Comments: {article.commentCount ?? 0}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/${article.id}`}
          className="border px-3 py-1 text-sm hover:underline"
        >
          View
        </Link>

        {(article.status === "DRAFT" ||
          article.status === "REJECTED") && (
          <Link
            href={`/dashboard/articles/${article.id}/edit`}
            className="border px-3 py-1 text-sm hover:underline"
          >
            Edit
          </Link>
        )}
      </div>
    </article>
  );
}

