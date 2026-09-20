"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import DOMPurify from "dompurify";
import { apiClient } from "@/lib/apiClient";

type Article = {
  id: string;
  title: string;
  content: string;
  abstract: string | null;
  miniature: string | null;
  status: string;
  updatedAt: string;
  author: { id: string; name: string };
};

export default function ReviewDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.articles.getReviewingArticle(params.id);
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
  async function handleDecision(decision: "APPROVED" | "REJECTED") {
    setSubmitError("");
    setSubmitting(decision);

    try {
      const reviewComment = await apiClient.articles.postReview(params.id, comment);
      if (!reviewComment.success) {
        setSubmitError(reviewComment.error || "Unable to submit review.");
        return;
      }
      const reviewDecision = await apiClient.articles.postDecision(reviewComment.data.id, decision);
      if (!reviewDecision.success) {
        setSubmitError(reviewDecision.error || "Unable to record decision.");
        return;
      }
      router.push("/review");
      router.refresh();
    } catch {
      setSubmitError("Unable to connect to the server.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <Link href="/review" className="border px-4 py-2 hover:underline">
          Back to queue
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
            />)}

            <h1 className="mt-6 border p-4 text-3xl font-bold">{article.title}</h1>

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

            <hr className="mt-10 border-t" />

            <div className="mt-8">
              <label htmlFor="comment" className="block text-sm font-bold">
                Review comment
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="mt-2 w-full border p-2 text-sm"
                placeholder="Share your feedback..."
              />

              {submitError && (
                <p className="mt-2 text-sm text-red-600">{submitError}</p>
              )}

              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => handleDecision("APPROVED")}
                  disabled={submitting !== null}
                  className="flex-1 border py-2 font-bold hover:underline disabled:opacity-50"
                >
                  {submitting === "APPROVED" ? "Submitting..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("REJECTED")}
                  disabled={submitting !== null}
                  className="flex-1 border py-2 font-bold hover:underline disabled:opacity-50"
                >
                  {submitting === "REJECTED" ? "Submitting..." : "Reject"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}