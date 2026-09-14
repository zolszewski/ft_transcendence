"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import DOMPurify from "dompurify";
import type { Article, Comment } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";

export default function ExploreDetail() {
  const params = useParams<{ id: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const response = await apiClient.auth.me();
      setIsLoggedIn(response.success);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function loadArticle() {
      setLoading(true);
      setError("");
      try {
        const getArticleResponse = await apiClient.articles.getById(params.id);
        if (getArticleResponse.success) {
          setArticle(getArticleResponse.data);
        } else {
          setError("Unable to load this article.");
        }
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
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

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!article) 
        return;
    if (!comment.trim()) {
      setCommentError("Write a comment before submitting.");
      return;
    }
    setSubmitting(true);
    setCommentError("");

    try {
      const postCommentResponse = await apiClient.articles.postComment(params.id, comment.trim());
      if (postCommentResponse.success === false) {
        setCommentError(postCommentResponse.error ?? "Unable to submit comment.");
        return;
      }
      const newComment = await postCommentResponse.data;
      setComments((current) => [newComment, ...current]);
      setComment("");
    } catch {
      setCommentError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <Link href="/explore" className="border px-4 py-2 hover:underline">
          Back to explore
        </Link>
        <LogoutButton />
      </header>

      <div className="mt-32 w-full max-w-2xl px-4 pb-16">
        {loading && <p className="text-sm">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && article && (
          <>
            {article.miniature && (
              <img
                src={article.miniature}
                alt={`Miniature for ${article.title}`}
                className="h-64 w-full object-cover"
              />
            )}

            <h1 className="mt-6 border p-4 text-3xl font-bold">{article.title}</h1>
            <p className="mt-1 text-sm text-gray-600">by {article.author.name}</p>

            {article.abstract && (
              <p className="mt-4 text-sm italic text-gray-700">{article.abstract}</p>
            )}

            <div
              className="article-content mt-6 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />

            <p className="mt-8 border-t pt-4 text-sm text-gray-600">
              By {article.author.name} · Edited on {new Date(article.updatedAt).toLocaleDateString()}
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

            {isLoggedIn === false && (
              <div className="mt-8 border-t pt-6">
                <p className="text-sm text-gray-700">
                  You must be logged in to leave a comment.
                </p>
                <Link href={`/authentication/login?redirect=/explore/${params.id}`} className="mt-3 inline-block border px-4 py-2 text-sm hover:underline">
                  Log in to comment
                </Link>
              </div>
            )}

            {isLoggedIn === true && (
              <form onSubmit={handleComment} className="mt-8 border-t pt-6">
                <label htmlFor="comment" className="block text-sm font-bold">
                  Add a comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  className="mt-2 w-full border p-2 text-sm"
                  placeholder="Write your feedback..."
                />

                {commentError && (
                  <p className="mt-2 text-sm text-red-600">{commentError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || comment.trim().length === 0}
                  className="mt-4 border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post comment"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
