"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import { Article } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import ArticleDetailView from "@/components/ArticleDetailView";

export default function ReviewDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<"APPROVED" | "REJECTED" | null>(null);


  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.articles.getReviewingArticle(params.id);
        if (!response.success) {
          setError(response.error || "Impossible de charger cet article." );
          setErrorStatus(response.status || null);
          return;
        }
        setArticle(response.data);
      } catch {
        setError("Impossible de se connecter au serveur.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);
  async function handleDecision(decision: "APPROVED" | "REJECTED") {

    setSubmitting(decision);

    try {
      const reviewComment = await apiClient.articles.postReview(params.id, comment);
      if (!reviewComment.success) {
        setError(reviewComment.error || "Impossible d'envoyer la relecture.");
        setErrorStatus(reviewComment.status || null);
        return;
      }
      const reviewDecision = await apiClient.articles.postDecision(reviewComment.data.id, decision);
      if (!reviewDecision.success) {
        setError(reviewDecision.error || "Impossible d'enregistrer la décision.");
        setErrorStatus(reviewDecision.status || null);
        return;
      }
      router.push("/review");
      router.refresh();
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setSubmitting(null);
    }
  }
  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }
  if (!article && !loading) {
    return <ErrorPage statusCode={404} message="Article introuvable" />;
  }

  return (
    <PageShell
      header={
        <AppHeader
          left={<NavLink href="/review">Retour à la file</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      {loading && <p className="text-sm">Chargement…</p>}

      {!loading && article && (
        <>
          <ArticleDetailView
            article={article}
            showAuthorByline={false}
          />

          <div className="section-divider-spaced">
            <label htmlFor="review-comment" className="block text-sm font-bold">
              Review comment
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="field-textarea"
              placeholder="Partagez votre avis…"
            />

            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => handleDecision("APPROVED")}
                disabled={submitting !== null}
                className="btn-action-full flex-1 font-bold"
              >
                {submitting === "APPROVED" ? "Envoi…" : "Approuver"}
              </button>
              <button
                type="button"
                onClick={() => handleDecision("REJECTED")}
                disabled={submitting !== null}
                className="btn-action-full flex-1 font-bold"
              >
                {submitting === "REJECTED" ? "Envoi…" : "Rejeter"}
              </button>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
