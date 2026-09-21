"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import { Article, Comment } from "@/lib/types";
import DOMPurify from "dompurify";

export default function MyArticleDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);


useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.articles.getById(params.id);
        if (!response.success) {
          setError(response.error || "Unable to load this article." );
          return;
        }
        setArticle(await response.data);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);
  useEffect(() => {
    async function loadComments() {
      if (!params.id) return;
      setCommentsLoading(true);
      try {
        const getCommentsResponse = await apiClient.articles.getComments(params.id);
        if (getCommentsResponse.success) {
          setComments(getCommentsResponse.data);
        } else {
          setComments([]);
        }
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }
    loadComments();
  }, [params.id]);
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
        <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
         <Link href="/dashboard" className="border px-4 py-2 hover:underline">
              Back to dashboard
            </Link>
            <LogoutButton />
          </header>
          <div className="mt-32 w-full max-w-2xl px-4 pb-16">
        {loading && <p className="text-sm">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && article && (
          <>
            {article.miniatureUrl && (
              <img
                src={article.miniatureUrl}
                alt={`Miniature for ${article.title}`}
                className="h-64 w-full object-cover"
              />
            )}

            <h1 className="mt-6 border p-4 text-3xl font-bold">{article.title}</h1>
            {article.abstract && (
              <p className="mt-4 text-sm italic text-gray-700">{article.abstract}</p>
            )}

            <div
              className="article-content mt-6 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />

            <p className="mt-8 border-t pt-4 text-sm text-gray-600">
                Edited on {new Date(article.updatedAt).toLocaleDateString()}
            </p>
            <section className="mt-10 border-t pt-6">
              <h2 className="text-xl font-bold">Comments</h2>

              {commentsLoading ? (
                <p className="mt-4 text-sm">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">No comments yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {comments.map((item) => (
                    <li key={item.id} className="rounded border p-4">
                      <p className="text-sm font-semibold">{item.author?.name ?? "User"}</p>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{item.content}</p>
                    </li>
                  ))}
                </ul>
              )}
              </section>
            </>
          )}
        </div>
      </main>
  );
}

