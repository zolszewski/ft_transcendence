"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import { Article, Comment } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import ArticleDetailView from "@/components/ArticleDetailView";
import CommentsSection from "@/components/CommentsSection";

export default function MyArticleDetail() {
  const params = useParams<{ id: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
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
          setErrorStatus(response.status || null);
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
  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }
  if (!article && !loading) 
    return <ErrorPage statusCode={404} message="Article not found" />;

  return (
    <PageShell
      header={
        <AppHeader
          left={<NavLink href="/dashboard">Back to dashboard</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      {loading && <p className="text-sm">Loading...</p>}

      {!loading && article && (
        <>
          <ArticleDetailView
            article={article}
            showAuthorByline={false}
            showAuthorInFooter={false}
          />
          <CommentsSection comments={comments} loading={commentsLoading} />
        </>
      )}
    </PageShell>
  );
}
