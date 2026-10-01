"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import type { Article, Comment } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import ArticleDetailView from "@/components/ArticleDetailView";
import CommentsSection from "@/components/CommentsSection";
import CommentForm from "@/components/CommentForm";
import LoginToCommentPrompt from "@/components/LoginToCommentPrompt";

export default function ExploreDetail() {
  const params = useParams<{ id: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);


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
          setErrorStatus(getArticleResponse.status || null);
          return;
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
    apiClient.auth.me().then((response) => {
      setIsLoggedIn(response.success);
    });
  }, []);

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
      if (!postCommentResponse.success) {
        setCommentError(postCommentResponse.error ?? "Unable to submit comment.");
        setErrorStatus(postCommentResponse.status || null);
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
  if (error)  {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }
  return (
    <PageShell
      header={
        <AppHeader
          left={<NavLink href="/explore">Back to explore</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      {loading && <p className="text-sm">Loading...</p>}

      {!loading && article && (
        <>
          <ArticleDetailView article={article} />

          <CommentsSection comments={comments} loading={commentsLoading} />

          {isLoggedIn === false ? (
            <LoginToCommentPrompt
              loginHref={`/authentication/login?redirect=/explore/${params.id}`}
            />
          ) : null}

          {isLoggedIn === true ? (
            <CommentForm
              value={comment}
              onChange={setComment}
              onSubmit={handleComment}
              error={commentError}
              submitting={submitting}
            />
          ) : null}
        </>
      )}
    </PageShell>
  );
}
