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
import FilterSection, {
  emptyExploreFilters,
  type ExploreFilters,
  type ExploreSort,
} from "@/components/FilterSection";

const LIMIT = 10;

function exploreDateRange(filters: ExploreFilters) {
  return {
    createdFrom: filters.createdFrom ? `${filters.createdFrom}T00:00:00.000Z` : undefined,
    createdTo: filters.createdTo ? `${filters.createdTo}T23:59:59.999Z` : undefined,
  };
}

export default function ExplorePageContent() {
  const [articles, setArticles] = useState<ListResult<Article> | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterDraft, setFilterDraft] = useState<ExploreFilters>(emptyExploreFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExploreFilters>(emptyExploreFilters);
  const [sort, setSort] = useState<ExploreSort>("newest");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  async function fetchPage(
    targetPage: number,
    currentSearch: string,
    currentFilters: ExploreFilters,
    currentSort: ExploreSort,
    replace: boolean,
  ) {
    try {
      const dates = exploreDateRange(currentFilters);
      const getArticles = await apiClient.articles.explore({
        page: targetPage,
        limit: LIMIT,
        sort: currentSort,
        ...(currentSearch ? { search: currentSearch } : {}),
        ...(currentFilters.faculty.trim() ? { faculty: currentFilters.faculty.trim() } : {}),
        ...dates,
        ...(currentFilters.friendsOnly && isLoggedIn === true ? { friendsOnly: true } : {}),
      });
      if (!getArticles.success) {
        setError("Impossible de charger les articles.");
        setErrorStatus(getArticles.status);
        return;
      }
      setError("");
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
      setError("Impossible de se connecter au serveur.");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPage(1, search, appliedFilters, sort, true).finally(() => setLoading(false));
  }, [search, appliedFilters, sort, isLoggedIn]);

  useEffect(() => {
    apiClient.auth.me().then((response) => setIsLoggedIn(response.success));
  }, []);

  useEffect(() => {
    if (isLoggedIn === false) {
      setFilterDraft((previous) =>
        previous.friendsOnly ? { ...previous, friendsOnly: false } : previous,
      );
      setAppliedFilters((previous) =>
        previous.friendsOnly ? { ...previous, friendsOnly: false } : previous,
      );
    }
  }, [isLoggedIn]);

  function applyFilters() {
    setAppliedFilters({
      ...filterDraft,
      friendsOnly: isLoggedIn === true ? filterDraft.friendsOnly : false,
    });
  }

  function clearFilters() {
    setFilterDraft(emptyExploreFilters);
    setAppliedFilters(emptyExploreFilters);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1, search, appliedFilters, sort, false);
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
          left={<NavLink href="/">Accueil</NavLink>}
          right={
            <div className="flex items-center gap-2">
              <NavLink href={recommendationsHref}>Mes recommandations</NavLink>
              <LogoutButton />
            </div>
          }
        />
      }
    >
      <FilterSection
        filters={filterDraft}
        appliedFilters={appliedFilters}
        sort={sort}
        onSortChange={setSort}
        onChange={setFilterDraft}
        onApply={applyFilters}
        onClear={clearFilters}
        isLoggedIn={isLoggedIn}
      />

      <ArticleSearchList
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        loadingMore={loadingMore}
        articles={articles?.data ?? []}
        emptyMessage="Aucun article trouvé."
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        getArticleHref={(article) => `/explore/${article.id}`}
        listClassName="mt-4 flex flex-col gap-4"
      />
    </PageShell>
  );
}
