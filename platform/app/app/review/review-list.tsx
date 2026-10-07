"use client";
 
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import LogoutButton from "@/components/LogoutButton";
import type { Article, ListResult } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import PageHeading from "@/components/PageHeading";
import ArticleSearchList from "@/components/ArticleSearchList";

const LIMIT = 10;
 
export default function ReviewList() {
  const [articles, setArticles] = useState<ListResult<Article> | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
 
  async function fetchPage(targetPage: number, currentSearch: string, replace: boolean) {
    try {
      const getArticles = await apiClient.articles.getSubmittedArticles({
        page: targetPage,
        limit: LIMIT,
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      if (!getArticles.success) {
        setError("Impossible de charger les articles en attente de relecture.");
        setErrorStatus(getArticles.status || null);
        return;
      }
      setArticles((prev) => {
        if (replace || !prev) return getArticles.data;

        return {
          ...getArticles.data,
          data: [...prev.data, ...getArticles.data.data],
        };
      });
      setPage(getArticles.data.page);
      setTotalPages(getArticles.data.pages);
    } catch {
      setError("Impossible de se connecter au serveur.");
    }
  }
  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPage(1, search, true).finally(() => setLoading(false));
  }, [search]);
 
  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1, search, false);
    setLoadingMore(false);
  }
 
  const hasMore = page < totalPages;
 
  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }
  return (
    <PageShell
      header={
        <AppHeader
          left={<NavLink href="/">Accueil</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      <ArticleSearchList
        heading={
          <PageHeading
            title="File de relecture"
            description="Articles submitted by other authors, waiting for a review."
          />
        }
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        loadingMore={loadingMore}
        articles={articles?.data ?? []}
        emptyMessage="Nothing to review right now."
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        getArticleHref={(article) => `/review/${article.id}`}
      />
    </PageShell>
  );
}
 