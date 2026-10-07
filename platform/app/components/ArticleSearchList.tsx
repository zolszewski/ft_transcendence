"use client";

import type { Article } from "@/lib/types";
import ArticleListLinkItem from "@/components/ArticleListLinkItem";

type ArticleSearchListProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  loading: boolean;
  loadingMore: boolean;
  articles: Article[];
  emptyMessage: string;
  hasMore: boolean;
  onLoadMore: () => void;
  getArticleHref: (article: Article) => string;
  heading?: React.ReactNode;
  listClassName?: string;
};

export default function ArticleSearchList({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher par titre ou contenu…",
  loading,
  loadingMore,
  articles,
  emptyMessage,
  hasMore,
  onLoadMore,
  getArticleHref,
  heading,
  listClassName = "mt-8 flex flex-col gap-4",
}: ArticleSearchListProps) {
  return (
    <>
      {heading}

      <input
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="field-input mt-6"
      />

      {loading ? <p className="mt-8 text-sm">Chargement…</p> : null}

      {!loading && articles.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}

      {!loading && articles.length > 0 ? (
        <ul className={listClassName}>
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleListLinkItem
                article={article}
                href={getArticleHref(article)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore && !loading ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="btn-action-full mt-8"
        >
          {loadingMore ? "Chargement…" : "Charger plus"}
        </button>
      ) : null}
    </>
  );
}
