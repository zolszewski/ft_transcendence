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
import {
  getArticleMiniatureFocus,
  getArticleMiniatureUrl,
  getArticlePdfUrl,
  hasStoredMiniature,
  hasStoredPdf,
} from "@/lib/articleUtils";

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!articleId) {
      setError("Identifiant d'article manquant dans l'URL.");
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
          setError(response.error || "Impossible de charger l'article");
          setErrorStatus(response.status);
          return;
        }
        setArticle(response.data);
      } catch {
        setError("Impossible de se connecter au serveur.");
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
      setPageError(response.error || "Impossible de téléverser l'image");
      return null;
    }
    return response.data.url;
  }

  async function handleSave() {
    if (!editorRef.current) {
      setPageError("L'éditeur n'est pas prêt.");
      return;
    }

    setSaving(true);
    setPageError("");

    try {
      const data = editorRef.current.getData();

      if (!data.title.trim()) throw new Error("Le titre est obligatoire.");
      if (!data.content.trim()) throw new Error("Le contenu de l'article est obligatoire.");

      if (editorRef.current.image || editorRef.current.pdf) {
        setUploadProgress(0);
      }
      const updateResponse = await apiClient.articles.update(
        articleId,
        data.title,
        data.content,
        editorRef.current.image,
        article?.abstract ?? "",
        editorRef.current.pdf,
        editorRef.current.pdfRemoved,
        editorRef.current.getMiniatureFocus(),
        setUploadProgress,
      );
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || "Impossible de mettre à jour l'article");
      }

      editorRef.current.clearImage();
      editorRef.current.clearPdf();
      sessionStorage.setItem("flash-message", "Article updated successfully.");
      router.push(`/dashboard/${articleId}`);
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Impossible de mettre à jour l'article");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  if (loading) {
    return <main className="p-8">Chargement de l'article…</main>;
  }

  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  if (!article) {
    return <ErrorPage statusCode={404} message="Article introuvable" />;
  }

  return (
    <PageShell
      variant="dashboard"
      header={
        <AppHeader
          variant="bordered"
          left={
            <NavLink href={`/dashboard/${article.id}`}>Retour à l&apos;article</NavLink>
          }
          center={<h1 className="text-xl font-bold">Edit Article</h1>}
          right={<NavLink href="/dashboard">Dashboard</NavLink>}
        />
      }
    >
        {pageError ? (
          <p className="alert-banner-error">{pageError}</p>
        ) : null}
        
        <UploadProgress percent={uploadProgress} />

        <div className="mt-6">
          <TextEditor
            ref={editorRef}
            initialData={{ title: article.title, content: article.content }}
            initialImageUrl={
              hasStoredMiniature(article)
                ? (getArticleMiniatureUrl(article) ?? undefined)
                : undefined
            }
            initialPdfUrl={
              hasStoredPdf(article) ? (getArticlePdfUrl(article) ?? undefined) : undefined
            }
            initialMiniatureFocus={
              hasStoredMiniature(article) ? getArticleMiniatureFocus(article) : undefined
            }
            onImageUpload={handleContentImageUpload}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-nav disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
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