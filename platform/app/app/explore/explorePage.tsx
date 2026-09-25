"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import type { Article, ListResult } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";

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
    
    async function fetchPage(targetPage: number, currentSearch: string, replace: boolean) {
        const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(LIMIT),
        });
        if (currentSearch) params.set("search", currentSearch);

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
        <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
            <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
                <Link href="/" className="border px-4 py-2 hover:underline">
                    Home
                </Link>
                <LogoutButton />
            </header>
        <div className="mt-20 w-full max-w-3xl px-4">
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or content..."
                    className="w-full border p-2"
                />
            </div>
            {loading && <p className="text-sm">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!loading && !error && articles?.data?.length === 0 && (
                <p className="text-sm">No articles found.</p>
            )}
            <ul>
                {articles?.data.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/explore/${article.id}`}
                  className="block border p-4 hover:underline"
                >
                  {article.miniatureUrl && (
                    <img
                      src={article.miniatureUrl}
                      alt={`Miniature for ${article.title}`}
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <span className="block font-bold">{article.title}</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    by {article.author.name} ·{" "}
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                  {article.abstract && (
                    <span className="mt-2 block text-sm">{article.abstract}</span>
                  )}
                </Link>
              </li>
            ))}
            </ul>
        {hasMore && !loading && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="mt-8 w-full border py-2 hover:underline disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </main>
  );
}
 