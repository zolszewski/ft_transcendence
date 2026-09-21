"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import LogoutButton from "@/components/LogoutButton";
import type { Article, ListResult } from "@/lib/types";
 
const LIMIT = 10;
 
export default function ReviewList() {
  const [articles, setArticles] = useState<ListResult<Article> | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
 
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
      const getArticles = await apiClient.articles.getSubmittedArticles({
        page: targetPage,
        limit: LIMIT,
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      if (!getArticles.success) {
        setError("Unable to load articles awaiting review.");
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
      setError("Unable to connect to the server.");
    }
  }
 
  // Initial load, and reload whenever the search term changes.
  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPage(1, search, true).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
 
  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1, search, false);
    setLoadingMore(false);
  }
 
  const hasMore = page < totalPages;
 
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <Link href="/" className="border px-4 py-2 hover:underline">
          Home
        </Link>
        <LogoutButton />
      </header>
 
      <div className="mt-32 w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold">Review queue</h1>
        <p className="mt-2 text-sm text-gray-600">
          Articles submitted by other authors, waiting for a review.
        </p>
 
        <input
          type="text"
          placeholder="Search by title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 w-full border p-2"
        />
 
        {loading && <p className="mt-8 text-sm">Loading...</p>}
        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
 
        {!loading && !error && articles?.data.length === 0 && (
          <p className="mt-8 text-sm text-gray-600">
            Nothing to review right now.
          </p>
        )}
 
        {!loading && articles && articles.data.length > 0 && (
          <ul className="mt-8 flex flex-col gap-4">
            {articles.data.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/review/${article.id}`}
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
        )}
 
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
 
