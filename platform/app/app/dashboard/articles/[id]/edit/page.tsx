"use client";

import { useEffect, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import { useParams, useRouter } from "next/navigation";
import ErrorPage from "@/components/ErrorPage";
import TextEditor, { type TextEditorHandle } from "@/components/text-editor";
import UploadProgress from "@/components/uploadProgress";
import { apiClient } from "@/lib/apiClient";
import type { Article } from "@/lib/types";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const articleId = params.id;

  const editorRef = useRef<TextEditorHandle>(null);
  const [article, setArticle] = useState<Article | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load failure -> full-page ErrorPage
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // action failure (save / image upload) -> inline banner
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!articleId) {
      setError("Missing article id in the URL.");
      setErrorStatus(400);
      setLoading(false);
      return;
    }
    async function loadArticle() {
      setLoading(true);
      setError("");
      setErrorStatus(null);
      try {
        const response = await apiClient.articles.getById(articleId);
        if (!response.success) {
          setError(response.error || "Failed to load article");
          setErrorStatus(response.status);
          return;
        }
        setArticle(response.data);
      } catch {
        setError("Unable to connect to the server.");
        setErrorStatus(0);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId]);

  async function handleContentImageUpload(file: File): Promise<string | null> {
    setUploadProgress(0);
    const response = await apiClient.uploads.image(file, "PUBLIC", setUploadProgress);
    setUploadProgress(null);
    if (!response.success) {
      setPageError(response.error || "Failed to upload image");
      return null;
    }
    return response.data.url;
  }

  async function handleSave() {
    if (!editorRef.current) {
      setPageError("Editor is not ready.");
      return;
    }

    setSaving(true);
    setPageError("");
    setSuccess("");

    try {
      const data = editorRef.current.getData();

      if (!data.title.trim()) throw new Error("Title is required.");
      if (!data.content.trim()) throw new Error("Article content is required.");

      if (editorRef.current.image) setUploadProgress(0);
      const updateResponse = await apiClient.articles.update(
        articleId,
        data.title,
        data.content,
        editorRef.current.image,
        article?.abstract ?? ""
      );
      setUploadProgress(null);
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || "Failed to update article");
      }

      setSuccess("Article updated successfully.");
      editorRef.current.clearImage();

      const refreshed = await apiClient.articles.getById(articleId);
      if (refreshed.success) setArticle(refreshed.data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to update article");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-8">Loading article...</main>;
  }

  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  if (!article) {
    return <ErrorPage statusCode={404} message="Article not found" />;
  }

  return (
    <PageShell
      variant="dashboard"
      header={
        <AppHeader
          variant="bordered"
          left={
            <NavLink href={`/dashboard/${article.id}`}>Back to article</NavLink>
          }
          center={<h1 className="text-xl font-bold">Edit Article</h1>}
          right={<NavLink href="/dashboard">Dashboard</NavLink>}
        />
      }
    >
        {pageError ? (
          <p className="alert-banner-error">{pageError}</p>
        ) : null}
        {success ? (
          <p className="alert-banner-success">{success}</p>
        ) : null}
        <UploadProgress percent={uploadProgress} />

        <TextEditor
          ref={editorRef}
          initialData={{ title: article.title, content: article.content }}
          initialImageUrl={article.miniatureUrl}
          onImageUpload={handleContentImageUpload}
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-nav disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${article.id}`)}
            className="btn-nav"
          >
            Cancel
          </button>
        </div>
    </PageShell>
  );
}