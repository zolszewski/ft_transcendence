"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import type { Article, ListResult } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import ArticleSearchList from "@/components/ArticleSearchList";

const LIMIT = 10;

export default function ExplorePageContent() {
  const [articles, setArticles] = useState<ListResult<Article> | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  async function fetchPage(targetPage: number, currentSearch: string, replace: boolean) {
    try {
      const getArticles = await apiClient.articles.explore({
        page: targetPage,
        limit: LIMIT,
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      if (!getArticles.success) {
        setError("Unable to load articles.");
        setErrorStatus(getArticles.status);
        return;
      }
      setArticles((previousArticles) =>
        replace || !previousArticles
          ? getArticles.data
          : {
              ...getArticles.data,
              data: [...previousArticles.data, ...getArticles.data.data],
            },
      );
      setPage(getArticles.data.page);
      setTotalPages(getArticles.data.pages);
    } catch {
      setError("Unable to connect to the server.");
    }
  }

  useEffect(() => {
    fetchPage(1, search, true).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    apiClient.auth.me().then((response) => setIsLoggedIn(response.success));
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1, search, false);
    setLoadingMore(false);
  }

  const hasMore = page < totalPages;

  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  const recommendationsHref =
    isLoggedIn === true
      ? "/explore/recommendations"
      : `/authentication/login?redirect=${encodeURIComponent("/explore/recommendations")}`;

  return (
    <PageShell
      width="default"
      offset="sm"
      header={
        <AppHeader
          left={<NavLink href="/">Home</NavLink>}
          right={
            <div className="flex items-center gap-2">
              <NavLink href={recommendationsHref}>My Recommendations</NavLink>
              <LogoutButton />
            </div>
          }
        />
      }
    >
      <ArticleSearchList
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        loadingMore={loadingMore}
        articles={articles?.data ?? []}
        emptyMessage="No articles found."
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        getArticleHref={(article) => `/explore/${article.id}`}
        listClassName="mt-4 flex flex-col gap-4"
      />
    </PageShell>
  );
}
